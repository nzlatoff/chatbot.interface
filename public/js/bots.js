// $(() => {
const socket = io();

let lesBots;
let currentBot = -1;
let direct = false;
let currentChar = "";

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

function emptyBoxes() {
  // console.log('removing boxes', data);
  $('.talkco').each((index, el) => {
    // console.log('emptying box', el.id);
    $(el).empty();
  });
};

// leaner scrolling
// https://stackoverflow.com/a/11551414
function adjustScroll(el) {
  // console.log(`adjusting scroll for: #${el}`);
  $(el).scrollTop($(el).prop("scrollHeight"));
}

function createMessage(data) {
  // console.log("creating message", data);
  new Promise((res, rej) => {
    if (!data.character && !data.message) {
      // $(`#${data.id}`).html(`<em>${data.user}:</em> `);
      ic = document.createElement("i");
      ic.className = "fas fa-spinner fa-spin";
      leDiv = $(`#${data.id}`);
      if (leDiv.text() === "(...)") {
        console.log('icon', data);
        $(`#${data.id}`).html(ic);
      } else {
        $(`#${data.id}`).append(ic);
      }
    } else {
      // $(`#${data.id}`).html(`<em>${data.user}:</em><br>${data.character}<br>${data.message}`);
      if (direct) {
        let char;
        console.log('char:', data.character, '| current:', currentChar);
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
    // if (autoScroll[]) adjustScroll('#users-wrapper');
    adjustScroll(`#users`);
  });
}

function filterBot(data) {
  if (currentBot === -1) {
    // console.log('no bot filtering');
    createMessage(data);
  } else {
    id = Object.keys(lesBots)[currentBot];
    // console.log('only bot:', lesBots[id]);
    if (data.id === id) {
      createMessage(data);
    }
  }
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

socket.on("received direct", data => {
  // console.log("received direct", data);
  if (direct) {
    filterBot(data);
  }
});

socket.on("notifyTyping", data => {
  // console.log('received typing', data);
  if (!direct) {
    filterBot(data);
  }
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

  if (e.key === 'd') {
    direct = !direct;
    console.log('direct:', direct);
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

  // console.log(e);
  if (e.keyCode === 32 || e.key === ' ') {
    document.getElementById('la-box').classList.toggle('box-no-border');
  }

  if (e.key === 'b') {
    // modulo cycle shifted left by 1
    currentBot = (currentBot + 2) % (Object.keys(lesBots).length + 1) - 1;
    if (currentBot === -1) {
      console.log('bot index:', currentBot, '| using all bots');
      $('#info-bot').text('using all bots');
      $('#info-bot').fadeIn('slow');
      $('#info-bot').fadeOut('slow');
    } else {
      emptyBoxes();
      let leB = lesBots[Object.keys(lesBots)[currentBot]];
      console.log('bot index:', currentBot, '| current bot:', leB.user, leB.id);
      $('#info-bot').html(`bot: ${leB.user}<br>${leB.id}`);
      $('#info-bot').fadeIn('slow');
      $('#info-bot').fadeOut('slow');
    }
  }
};
