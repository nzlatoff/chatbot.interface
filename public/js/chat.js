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

window.addEventListener('load', () => $('#message').focus());

function deleteAllCookies() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

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
    div.innerHTML = `<em>${client.user}:</em> (...)`;
    document.querySelector('#interactive-box').appendChild(div);
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
      delete autoScroll[el.id];
    }
  });
};

function clearUser(data) {
  $(`#${data.id}`).remove();
  delete autoScroll[data.id];
}

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

// new message received, only for web clients
socket.on("current session message", data => {
  // console.log("current session message", data);
  appendMessage(data, scroll=false);
});

// finish session load
socket.on("scroll down", ()  => {
  // console.log("scrolling down");
  adjustScroll('#messages');
  adjustScroll('#interactive-box .talko');
});

// ctrl+enter to submit
$('textarea').keydown(function(e) {
  if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
    $("#send-form").submit();
  }
});

// scrolling

// if scroll at bottom of output container, enable autoscroll
$('#messages, #interactive-box .talkco').each((i, el) => {
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

function adjustScroll(el, speed=500) {
  // console.log(`adjusting scroll for: ${el}`);
  $(el).each((i, e) => {
    $(e).animate({ scrollTop: $(e).prop("scrollHeight")}, speed);
  });
}

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
  clearUser(data);
});

socket.on('bot left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  clearUser(data);
});

function emitTyping(scroll=true) {
  socket.emit("typing", {
    id: socket.id,
    user: cookie2obj(document.cookie).userData,
    message: $("#message").val(),
    character: $("#character").val(),
    scroll: scroll
  });
}

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
    ic = document.createElement("i");
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
  removeUnusedBoxes(data);
});

socket.on('erase messages', () => {
  $('#messages').empty();
  $('#interactive-box').empty();
});

function appendMessage(data, scroll=true) {
  new Promise((res, rej) => {
    let div = document.createElement('div');
    div.className = "message";
    let messages = document.getElementById('messages');
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
    if (scroll && autoScroll['messages']) adjustScroll('#messages');
  });
};

document.getElementById('save-button').addEventListener('click', (e) => {
  console.log('saving current sess');
  window.open('/chats', '_blank');
});

document.getElementById('login-button').addEventListener('click', (e) => {
  window.open('/login.html', '_self');
});

