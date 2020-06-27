// $(() => {
const socket = io();

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit('get list');
  socket.emit("new user", cookie2obj(document.cookie).userData);
  emitTyping();
  $('#username').html(`<em>${cookie2obj(document.cookie).userData}:</em>`);
});

window.addEventListener('load', () => $('#message').focus());

var messages = document.getElementById("messages");

function deleteAllCookies() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}
// deleteAllCookies();

// util function to parse local cookie
function cookie2obj(str) {
  str = str.split('; ');
  let result = {};
  for (let i = 0; i < str.length; i++) {
    const cur = str[i].split('=');
    result[cur[0]] = decodeURIComponent(cur[1]);
  }
  return result;
}

function createInteractiveBox(client) {
  // console.log('creating box, client:', client);
  // check if there isn't a div already
  if (!$(`#${client.id}`).length) {
    // console.log('creating element', client.id, 'for user', client.user);
    let div = document.createElement("div");
    div.id = client.id;
    div.className = 'talkco';
    div.innerHTML = `<em>${client.user}: </em>`;
    users.appendChild(div);
  } else {
    // console.log('found element', $(`#${client.id}`));
  }
};

function removeUnusedBoxes(data) {
  // console.log('removing boxes', data);
  $('.talkco').each((index, el) => {
    // console.log('while removing, el:', el.id);
    if (!(el.id in data)) {
      // console.log('removing box', el.id);
      el.remove();
    }
  });
};

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

// new message received
socket.on("received", data => {
  appendMessage(data);
});

// fetching initial chat messages from the database
(function() {
  datefrom = new Date().toISOString().substring(0,10); // just print today's message by default
  fetch("/chats?datefrom="+datefrom)
    .then(data => {
      return data.json();
    })
    .then(json => {
      json.map(data => {
        appendMessage(data, scroll=false);
      });
    })
    .then(() => {
      // console.log('loaded db');
      $("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 1000);
    });
})();

// ctrl+enter to submit
$('textarea').keydown(function(e) {
  if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
    $("#send-form").submit();
  }
});

// scrolling

let autoScroll = true;

// if scroll at bottom of output container, enable autoscroll
$('#messages').scroll((e) => {
  // console.log('#messages scrolled: disabling autoscroll');
  autoScroll = false;
  let outTop = $('#messages').prop('scrollTop');
  const outMax = $('#messages').prop('scrollTopMax');
  if (outTop == outMax) {
    // console.log('back to the bottom: reenabling autoscroll');
    autoScroll = true;
  }
});

function adjustScroll() {
  let outTop = $('#messages').prop('scrollTop');
  const outMax = $('#messages').prop('scrollTopMax');
  // console.log(`scrollTop: ${outTop}, scrollHeight: ${outMax}`);
  if (outTop < outMax) {
    $("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 1000);
  }
}

socket.on("new user", data => {
  // console.log('new user (will create box):', data);
  createInteractiveBox(data);
});

socket.on('user left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  $(`#${data.id}`).remove();
});

function emitTyping() {
  socket.emit("typing", {
    id: socket.id,
    user: cookie2obj(document.cookie).userData,
    message: $("#message").val(),
    character: $("#character").val()
  });
}

// isTyping events
$("#message, #character").on("keyup", () => {
  // console.log('keyup, sending id', socket.id);
  emitTyping();
});

// get current state of input boxes at the server's request
// (used after a new client connects or one refreshes)
socket.on("get typing", () => {
  emitTyping();
});

socket.on("notifyTyping", data => {
  // typing.innerText = data.user + " " + data.message;
  console.log('received typing', data);
  $(`#${data.id}`).html(`<em>${data.user}: ${data.character} ${data.message}</em>`);
});

socket.on('disconnect', () => {
  // console.log('you have been disconnected');
});

socket.on('reconnect', () => {
  // console.log('you have been reconnected');
});

socket.on('users list', function(data) {
  // console.log('users list (before removal/adding boxes)', data);
  for (const client in data) {
    // console.log(' - client:', client);
    createInteractiveBox(data[client]);
  }
  // update interactive boxes
  removeUnusedBoxes(data);
});

function appendMessage(data, scroll=true) {
  let div = document.createElement("div");
  var messages = document.getElementById("messages");
  // console.log('received', data);
  if (data.character) {
    div.innerHTML = `${data.character}<br>${data.message}`;
  } else {
    div.innerHTML = data.message;
  }
  messages.appendChild(div);
  if (scroll && autoScroll) adjustScroll();
};

// });
