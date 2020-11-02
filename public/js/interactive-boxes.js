function createInteractiveBox(client, username=true, dots=true) {
  // console.log('creating box, client:', client);
  // check if there isn't a div already
  if (!$(`#${client.id}`).length) {
    // console.log('creating element', client.id, 'for user', client.user);
    let div = document.createElement("div");
    div.id = client.id;
    div.className = 'talkco';
    if (username) {
      div.innerHTML += `<em>${client.user}:</em>`;
    }
    if (dots) {
      div.innerHTML += ` (...)`;
    }
    div.innerHTML += '<br>';
    document.querySelector('#interactive-box').appendChild(div);
  } else {
    // console.log('found element', $(`#${client.id}`));
  }
};

function removeUnusedBoxes(target, data, autoScroll=null) {
  // console.log('removing boxes', data);
  $(target).each((index, el) => {
    // console.log('while removing, el:', el.id);
    if (!(el.id in data)) {
      // console.log('removing box', el.id);
      el.remove();
      if (autoScroll) delete autoScroll[el.id];
    }
  });
  return autoScroll;
};

function clearUser(data, autoScroll) {
  $(`#${data.id}`).remove();
  delete autoScroll[data.id];
  return autoScroll;
}

function filterBot(fn, data, lesBots, currentBot) {
  if (currentBot === -1) {
    // console.log('no bot filtering');
    fn(data);
  } else {
    const id = Object.keys(lesBots)[currentBot];
    // console.log('only bot:', lesBots[id]);
    if (data.id === id) {
      fn(data);
    }
  }
}

function emptyBoxes(lesBots, currentBot) {
  // console.log('removing boxes', data);
  $('.talkco').each((index, el) => {
    // console.log('emptying box', el.id);
    // $(el).html('(...)');
    if (el.id != Object.keys(lesBots)[currentBot]) {
      $(el).hide();
    } else {
      $(el).show();
    }
  });
};

// https://stackoverflow.com/a/61885827/9638108
function playTTS(text, lang, speed=0.9) {
  // Get the audio element
  const audioEl = document.createElement('audio');
  const url= `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`;
  // add the sound to the audio element
  audioEl.src = url;
  audioEl.playbackRate = speed;
  //For auto playing the sound
  audioEl.play();
  audioEl.remove();
};

export { createInteractiveBox, removeUnusedBoxes, clearUser, filterBot, emptyBoxes, playTTS };
