import { createInteractiveBox, removeUnusedBoxes, clearUser } from './interactive-boxes.js';
import { deleteAllCookies, cookie2obj, adjustScroll } from './utils.js';

// $(() => {

function emitTyping(scroll=true) {
  const leUser = cookie2obj(document.cookie).userData;
  const leChar = $("#character").val();
  const msg = $("#message").val();
  socket.emit("typing", {
    id: socket.id,
    user: leUser,
    message: msg,
    character: leChar,
    scroll: scroll
  });

  // self-box
  if (!leChar && !msg) {
    // console.log('nothing to type:', leUser, leChar, msg);
    $(`#${socket.id}`).html(`<em>${leUser}:</em> `);
    let ic = document.createElement("i");
    ic.className = "fas fa-spinner fa-spin";
    $(`#${socket.id}`).append(ic);
  } else {
    // console.log('sth to type:', leUser, leChar, msg);
    $(`#${socket.id}`).html(`<em>${leUser}:</em> ${leChar} ${msg}`);
  }
  if (scroll && autoScroll[socket.id]) adjustScroll(`#${socket.id}`, 10);

}

const socket = io();

let autoScroll = {};

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit('get list');
  const leUser = cookie2obj(document.cookie).userData;
  socket.emit("new user", leUser);
  createInteractiveBox({ "id": socket.id, "user": leUser })
  emitTyping(scroll=false);
  $('#username').html(`${leUser}`);
});

// finish session load
socket.on("scroll down", ()  => {
  // console.log("scrolling down");
  adjustScroll('#interactive-box .talko');
});

socket.on("new user", data => {
  // console.log('new user (will create box):', data);
  if (data.id != socket.id) {
    createInteractiveBox(data);
    autoScroll[data.id] = true;
  }
});

socket.on('user left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  autoScroll = clearUser(data, autoScroll);
});

socket.on('bot left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  autoScroll = clearUser(data, autoScroll);
});

// get current state of input boxes at the server's request
// (used after a new client connects or one refreshes)
socket.on("get typing", () => {
  emitTyping(scroll=false);
});

socket.on("server sends typing", data => {
  // console.log('received typing', data, 'autoScroll:', autoScroll);
  if (!data.character && !data.message) {
    $(`#${data.id}`).html(`<em>${data.user}:</em> `);
    let ic = document.createElement("i");
    ic.className = "fas fa-spinner fa-spin";
    $(`#${data.id}`).append(ic);
  } else {
    $(`#${data.id}`).html(`<em>${data.user}:</em> ${data.character} ${data.message}`);
  }
  if (data.scroll && autoScroll[data.id]) adjustScroll(`#${data.id}`, 10);
});

socket.on('disconnect', () => {
  // console.log('you have been disconnected');
});

socket.on('reconnect', () => {
  // console.log('you have been reconnected');
});

socket.on('users list', (data) => {
  // update to include self
  data[socket.id] = {
      id: socket.id,
      user: cookie2obj(document.cookie).userData,
  }
  autoScroll[socket.id] = true;
  // console.log('users list (before removal/adding boxes)', data);
  for (const id in data) {
    // console.log(' - client:', id);
    createInteractiveBox(data[id]);
    autoScroll[id] = true;
  }
  // update interactive boxes
  autoScroll = removeUnusedBoxes('.talkco', data, autoScroll);
});

socket.on('erase messages', () => {
  $('#interactive-box').empty();
  createInteractiveBox({ "id": socket.id, "user": cookie2obj(document.cookie).userData })
  emitTyping(scroll=false);
});

// new message entered or received

// sending new message
$("#send-form").submit(function(e) {
  e.preventDefault(); // prevents page reloading
  // console.log('send form, username', cookie2obj(document.cookie).userData);
  const msg = {
    character: $('#character').val(),
    message: $("#message").val(),
    user: cookie2obj(document.cookie).userData
  }
  socket.emit("chat message", msg);
  $('#message').val('');
});

window.addEventListener('load', () => $('#message').focus());

// ctrl+enter to submit
$('textarea').keydown(function(e) {
  if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
    $("#send-form").submit();
  }
});

// https://stackoverflow.com/a/25621277
$('textarea').each(function () {
  this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
}).on('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// isTyping events
$("#message, #character").on("input", () => {
  // console.log('keyup, sending id', socket.id);
  emitTyping();
});

// scrolling

// if scroll at bottom of output container, enable autoscroll
$('#interactive-box .talkco').each((i, el) => {
  $(el).scroll((e) => {
    // console.log(`disabling autoscroll for: ${e.currentTarget.id}`);
    // console.log(`disabling autoscroll for: ${e.currentTarget.id} | scrollTop: ${$(e.currentTarget).prop('scrollTop')} | innerHeight ${$(e.currentTarget).innerHeight()} | sum ${$(e.currentTarget).prop('scrollTop') + $(e.currentTarget).innerHeight()} | scrollHeight ${$(e.currentTarget).prop('scrollHeight')}`);
    autoScroll[e.currentTarget.id] = false;
    // console.log(autoScroll);
    if($(e.currentTarget).prop('scrollTop') + $(e.currentTarget).innerHeight() >= $(e.currentTarget).prop('scrollHeight')) {
      // console.log(`back to the bottom for ${e.currentTarget.id}: reenabling autoscroll`);
      autoScroll[e.currentTarget.id] = true;
    }
  });
});

document.getElementById('login-button').addEventListener('click', (e) => {
  window.open('/login.html', '_self');
});
