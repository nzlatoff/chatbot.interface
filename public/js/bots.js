import { createInteractiveBox, removeUnusedBoxes, filterBot, emptyBoxes, spaceChunks, playTTS, playTTSChunks } from './interactive-boxes.js';
import { adjustScroll } from './utils.js';

// $(() => {
const socket = io();

let lesBots;
let currentBot = -1;
let direct = false;
let currentChar = "";

function createMessage(data) {
  // console.log("creating message", data);
  new Promise((res, rej) => {
    if (!data.character && !data.message) {
      // $(`#${data.id}`).html(`<em>${data.user}:</em> `);
      const ic = document.createElement("i");
      ic.className = "fas fa-spinner fa-spin";
      const leDiv = $(`#${data.id}`);
      if (leDiv.text() === "(...)") {
        // console.log('icon', data);
        $(`#${data.id}`).html(ic);
      } else {
        $(`#${data.id}`).append(ic);
      }
    } else {
      // $(`#${data.id}`).html(`<em>${data.user}:</em><br>${data.character}<br>${data.message}`);
      if (direct) {
        let char;
        // console.log('char:', data.character, '| current:', currentChar);
        if (data.character != currentChar) {
          char = data.character.toLowerCase() + '<br>';
          currentChar = data.character;
        } else {
          char = "";
        }
        const msg = data.message
          .replace(/\n/g, " ")
          .replace(/\(/g, " parenthèse ouverte ")
          .replace(/\)/g, " parenthèse fermée ")
          .toLowerCase();
        const laRequest = `${char.replace(/<br>/g, " ")}${msg}`;
        console.log(laRequest);
        const chunks = spaceChunks(laRequest, 200);
        console.log(chunks);
        playTTSChunks(chunks, 'fr');
        // playTTS(laRequest, 'fr');
        $(`#${data.id}`).html(`${char}${msg}<br>`);
      } else {
        if (data.character) {
          $(`#${data.id}`).html(`${data.character}<br>${data.message.replace("\n", "<br>")}<br>`);
        } else {
          $(`#${data.id}`).html(`${data.message.replace("\n", "<br>")}<br>`);
        }
      }
    }
    res();
  }).then(() => {
    adjustScroll(`#${data.id}`);
  });
}

function switchInteractiveMode() {
  direct = !direct;
  // console.log('direct:', direct);
  if (direct) {
    $('#info-mode').text('direct display');
    $('#info-mode').fadeIn('slow');
    $('#info-mode').fadeOut('slow');
  } else {
    $('#info-mode').text('gradual display');
    $('#info-mode').fadeIn('slow');
    $('#info-mode').fadeOut('slow');
  }
}

function switchBot() {
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

socket.on('connect', function() {
  // send the username to the server
  // console.log('connecting');
  socket.emit("get bot list");
});

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
    createInteractiveBox(data, false, true);
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
      createInteractiveBox(data[client], false, true);
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

socket.on("received direct", data => {
  // console.log("received direct", data);
  if (direct) {
    filterBot(createMessage, data, lesBots, currentBot);
  }
});

socket.on("server sends typing", data => {
  // console.log('received typing', data);
  if (!direct) {
    filterBot(createMessage, data, lesBots, currentBot);
  }
});

socket.on('disconnect', () => {
  // console.log('you have been disconnected');
});

socket.on('reconnect', () => {
  // console.log('you have been reconnected');
});

document.body.onkeyup = (e) => {

  console.log(e);

  if (e.key === 'd') {
    switchInteractiveMode();
  }

  // console.log(e);
  if (e.keyCode === 32 || e.key === ' ') {
    document.getElementById('interactive-box').classList.toggle('box-no-border');
  }

  if (e.key === 'b') {
    switchBot();
  }
};

document.body.ontouchstart = (e) => {
  if (e.touches.length === 2) {
    switchInteractiveMode();
  } else if (e.touches.length === 3) {
    switchBot();
  }
};
