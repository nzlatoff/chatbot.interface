import { createInteractiveBox, removeUnusedBoxes, clearUser } from './interactive-boxes.js';
import { adjustScroll } from './utils.js';

let displayState = 0;

// $(() => {

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

function adjustState(currentSate) {
  console.log('display state:', displayState);
  if (currentSate === 0) {
    $('#interactive-box').show();
    $('#messages-box').css('margin-top', 0);
    $('#messages-box').show();
  } else if (currentSate === 1) {
    $('#interactive-box').hide();
    $('#messages-box').css('margin-top', 5);
    $('#messages-box').show();
  } else {
    $('#interactive-box').show();
    $('#messages-box').hide();
  }
}

const socket = io();

let autoScroll = { 'messages': true };

let messages = document.getElementById("chat-messages");

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit('get list');
  socket.emit('new audience user');
});

socket.on("received", data => {
  // console.log("new message");
  appendMessage(data);
});

// new message received, only for web clients
socket.on("current session message", data => {
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
  createInteractiveBox(data);
  autoScroll[data.id] = true;
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

socket.on("server sends typing", (data) => {
  // console.log('received typing', data);
  // console.log('received typing', data, 'autoScroll:', autoScroll);
  if (!data.character && !data.message) {
    $(`#${data.id}`).html(`<em>${data.user}:</em> `);
    let ic = document.createElement("i");
    ic.className = "fas fa-spinner fa-spin";
    $(`#${data.id}`).append(ic);
  } else {
    const char = data.character.replace(/\n/g, '<br>');
    const msg = data.message.replace(/\n/g, '<br>');
    $(`#${data.id}`).html(`<em>${data.user}:</em> ${char}<br>${msg}`);
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
    // console.log(' - id:', id);
    createInteractiveBox(data[id]);
    autoScroll[id] = true;
  }
  // update interactive boxes
  autoScroll = removeUnusedBoxes('.talkco', data, autoScroll);
});

socket.on('erase messages', () => {
  // console.log('erasing');
  $('#chat-messages').empty();
  $('#interactive-box').empty();
  socket.emit('get list');
  socket.emit('get bot list');
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

document.body.onkeyup = (e) => {
  if (e.key === ' ') {
    displayState = (displayState + 1) % 3;
    adjustState(displayState);
  }
}

document.body.ontouchstart = (e) => {
  if (e.touches.length === 2) {
    displayState = (displayState + 1) % 3;
    adjustState(displayState);
  // } else if (e.touches.length === 3) {
  }
};

