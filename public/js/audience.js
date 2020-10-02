// $(() => {
const socket = io();

let autoScroll = { 'messages': true };

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit('get list');
  socket.emit('new audience user');
});

window.addEventListener('load', () => $('#message').focus());

var messages = document.getElementById("messages");

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

// new message received
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
  adjustScroll('#messages');
  adjustScroll('#interactive-box .talko');
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
  createInteractiveBox(data);
  autoScroll[data.id] = true;
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

socket.on("notifyTyping", (data) => {
  // console.log('received typing', data);
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
    // console.log(' - id:', id);
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
