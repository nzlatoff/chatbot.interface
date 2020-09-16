// $(() => {
const socket = io();

let lesBots;

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit("get bot list");
  socket.emit("get list");
});

function createInteractiveBox(client) {
  // console.log('creating box, client:', client);
  // check if there isn't a div already
  if (!$(`#${client.id}`).length) {
    // console.log('creating element', client.id, 'for user', client.user);
    let div = document.createElement("div");
    div.id = client.id;
    div.className = 'talkco';
    // div.innerHTML = `<em>${client.user}: </em>`;
    document.querySelector('#users').appendChild(div);
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

function adjustScroll(el) {
  // console.log(`adjusting scroll for: #${el}`);
  $(`#${el}`).scrollTop($(`#${el}`).prop("scrollHeight"));
}

socket.on("erase messages", data => {
  // console.log("resetting");
  $('.talkco').each((index, el) => {
    // console.log('emptying box', el.id);
    $(el).empty();
  });
});

socket.on("new bot", data => {
  console.log("new bot", data);
  new Promise((res, rej) => {
    createInteractiveBox(data);
    res();
  })
});

socket.on("bots list", data => {
  // console.log('received bots', data);
  lesBots = data;
});

socket.on('bot left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  $(`#${data.id}`).remove();
});

socket.on("notifyTyping", data => {
  // console.log('received typing', data, 'autoScroll:', autoScroll);
  new Promise((res, rej) => {
    if (!data.character && !data.message) {
      // $(`#${data.id}`).html(`<em>${data.user}:</em> `);
      ic = document.createElement("i");
      ic.className = "fas fa-spinner fa-spin";
      leDiv = $(`#${data.id}`);
      if (leDiv.text() === "(...)") {
        $(`#${data.id}`).html(ic);
      } else {
        $(`#${data.id}`).append(ic);
      }
    } else {
      // $(`#${data.id}`).html(`<em>${data.user}:</em><br>${data.character}<br>${data.message}`);
      $(`#${data.id}`).html(`${data.character}<br>${data.message}<br>`);
    }
    res();
  }).then(() => {
    // if (autoScroll[]) adjustScroll('#users-wrapper');
    adjustScroll(data.id);
  });
});

socket.on('disconnect', () => {
  // console.log('you have been disconnected');
});

socket.on('reconnect', () => {
  // console.log('you have been reconnected');
});

socket.on('users list', (data) => {
  // console.log('users list (before removal/adding boxes)', data);
    for (const client in data) {
      // console.log(' - client:', client);
      if (client in lesBots) {
        createInteractiveBox(data[client]);
      }
    }
    // update interactive boxes
    removeUnusedBoxes(data);
});

document.body.onkeyup = (e) => {
  // console.log(e);
  if (e.keyCode === 32 || e.key === ' ') {
    document.getElementById('la-box').classList.toggle('box-no-border');
  }
};
