import { createInteractiveBox, removeUnusedBoxes, clearUser } from './interactive-boxes.js';
import { deleteAllCookies, cookie2obj, adjustScroll } from './utils.js';

function appendMessage(data, scroll=true) {
  new Promise((res, rej) => {
    let div = document.createElement('div');
    let messages = document.getElementById('chat-messages');
    // console.log('received', data);
    const msg = data.message.replace(/\n/g, '<br>');
    if (data.character) {
      const char = data.character.replace(/\n/g, '<br>');
      div.innerHTML = `${char}<br>${msg}`;
    } else {
      div.innerHTML = msg;
    }
    messages.appendChild(div);
    res();
  }).then(() => {
    if (scroll && autoScroll['messages']) adjustScroll('#chat-messages');
  });
};

function emitTyping(scroll=true) {
  socket.emit("typing", {
    id: socket.id,
    user: cookie2obj(document.cookie).userData,
    message: $("#message").val(),
    character: $("#character").val(),
    scroll: scroll
  });
}

// $(() => {

const socket = io();

let autoScroll = { 'messages': true };

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit('get list');
  socket.emit("new user", cookie2obj(document.cookie).userData);
  emitTyping(scroll=false);
  $('#username').html(`${cookie2obj(document.cookie).userData}`);
});

// new message received
socket.on("received", data => {
  appendMessage(data);
});

// new message received, only for web clients
socket.on("current session message", data => {
  // console.log("current session message", data);
  appendMessage(data, scroll=false);
});

// finish session load
socket.on("scroll down", ()  => {
  // console.log("scrolling down");
  adjustScroll('#chat-messages');
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

// isTyping events
$("#message, #character").on("input", () => {
  // console.log('keyup, sending id', socket.id);
  emitTyping();
});

// get current state of input boxes at the server's request
// (used after a new client connects or one refreshes)
socket.on("get typing", () => {
  emitTyping(scroll=false);
});

socket.on("notifyTyping", data => {
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
  $('#chat-messages').empty();
  $('#interactive-box').empty();
});

window.addEventListener('load', () => $('#message').focus());

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
  appendMessage(msg);
  $('#message').val('');
});

// ctrl+enter to submit
$('textarea').keydown(function(e) {
  if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
    $("#send-form").submit();
  }
});

// scrolling

// if scroll at bottom of output container, enable autoscroll
$('#chat-messages, #interactive-box .talkco').each((i, el) => {
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
