import { createInteractiveBox, removeUnusedBoxes, emptyBoxes } from './interactive-boxes.js';
import { adjustScroll } from './utils.js';

// $(() => {
const socket = io();

let lesBots;
let currentBot = -1;
let currentChar = "";

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit("get bot list");
});

function createMessage(data) {
  console.log("creating message", data);
  new Promise((res, rej) => {
    if (!data.entrails) {
      console.log("breaking line");
      $(`#${data.id}`).append('<br>');
    } else {
      const container = document.getElementById(data.id);
      if (data.sep) {
        let d = document.createElement("span");
        container.appendChild(d);
        // console.log('received:', data.entrails)
        // https://stackoverflow.com/a/28240034
        let i = 0;
        do {
          i += 1;
          d.innerHTML += data.entrails;
          d.normalize();
          console.log(i, d.getClientRects(), d.getClientRects()[0].width, container.clientWidth);
        } while (i < 2000 && d.getClientRects()[0].width < container.clientWidth - 7);
        d.innerHTML = d.innerHTML.substring(0, d.innerHTML.length) + "\n";
      } else {
        // console.log('message:', data.entrails)
        let d;
        if (data.pre) {
          d = document.createElement("pre");
          // console.log(data.entrails);
          d.innerHTML = data.entrails;
          if (data.und) {
            for (let i = 0; i < data.entrails.length - 1; i++) {
              d.innerHTML += "-";
            }
          }
        } else if (data.no_cr) {
          d = container.lastElementChild;
          d.innerHTML += data.entrails;
        } else if (data.wipe) {
          d = container.lastElementChild;
          d.innerHTML = data.entrails;
        } else {
          d = document.createElement("div");
          d.innerHTML = data.entrails;
        }
        container.appendChild(d);
      }
    }
    res();
  }).then(() => {
    adjustScroll(`#${data.id}`, 0);
  });
}

socket.on("erase messages", data => {
  // console.log("resetting");
  $('.talkco').each((index, el) => {
    // console.log('emptying box', el.id);
    $(el).empty();
  });
});

socket.on("new bot", data => {
  // console.log("new bot", data);
  new Promise((res, rej) => {
    createInteractiveBox(data, false, false);
    res();
  })
});

socket.on("bots list", data => {
  // console.log('received bots', data);
  lesBots = data;
  // console.log('users list (before removal/adding boxes)', data);
  for (const client in data) {
    // console.log(' - client:', client);
    if (client in lesBots) {
      createInteractiveBox(data[client], false, false);
    }
  }
  // update interactive boxes
  removeUnusedBoxes('.talkco', data);
});

// socket.on('users list', (data) => {
// });

socket.on('bot left', function(data) {
  // send the username to the server
  // console.log('user left', data);
  $(`#${data.id}`).remove();
});

socket.on('disconnect', () => {
  // console.log('you have been disconnected');
});

socket.on('reconnect', () => {
  // console.log('you have been reconnected');
});

document.body.onkeyup = (e) => {

  if (e.key === 'b') {
    // modulo cycle shifted left by 1
    currentBot = (currentBot + 2) % (Object.keys(lesBots).length + 1) - 1;
    if (currentBot === -1) {
      // console.log('bot index:', currentBot, '| using all bots');
      $('#info-bot').text('using all bots');
      $('#info-bot').fadeIn('slow');
      $('#info-bot').fadeOut('slow');
      $('#interactive-box .talkco').show();
    } else {
      emptyBoxes(lesBots, currentBot);
      let leB = lesBots[Object.keys(lesBots)[currentBot]];
      // console.log('bot index:', currentBot, '| current bot:', leB.user, leB.id);
      $('#info-bot').html(`bot: ${leB.user}<br>${leB.id}`);
      $('#info-bot').fadeIn('slow');
      $('#info-bot').fadeOut('slow');
    }
  }
};

socket.on("entrails typing", data => {
  // console.log('received entrails', data);
  createMessage(data);
});
