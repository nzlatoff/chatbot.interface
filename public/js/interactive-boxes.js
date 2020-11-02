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

function spaceChunks(msg, maxLen=50) {
  let chunks = [];
  let total = msg.length;
  while (total > maxLen) {
    let tmp = msg.slice(0, maxLen);
    const lastSpaceInd = tmp.lastIndexOf(" ");
    tmp = tmp.slice(0, lastSpaceInd);
    chunks.push(tmp);
    msg = msg.slice(lastSpaceInd);
    total = msg.length;
    console.log('tmp: ', tmp, ' | msg now:', msg);
  }
  chunks.push(msg);
  // console.log(chunks);
  return chunks;
}

// https://stackoverflow.com/a/61885827/9638108
function playTTSChunks(chunks, lang='fr', speed=0.9) {
  let playEls = [];
  for (const text of chunks) {
    // Get the audio element
    // const audioEl = document.createElement('audio');
    // const url= `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`;
    const audioEl = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`);
    // add the sound to the audio element
    audioEl.playbackRate = speed;
    //For auto playing the sound
    playEls.push(audioEl);
  }
  for (let i = 0; i < playEls.length - 1; i++) {
    playEls[i].addEventListener('ended', () => {
      playEls[i].remove();
      playEls[i + 1].play();
    });
  }
  playEls[0].play()
};

// https://stackoverflow.com/a/61885827/9638108
function playTTS(text, lang='fr', speed=0.9) {
  // Get the audio element
  // const audioEl = document.createElement('audio');
  // const url= `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`;
  const audioEl = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`);
  // add the sound to the audio element
  // audioEl.src = url;
  audioEl.playbackRate = speed;
  //For auto playing the sound
  return new Promise((err, res) => {
    audioEl.play();
    audioEl.remove();
  });
};

export { createInteractiveBox, removeUnusedBoxes, clearUser, filterBot, emptyBoxes, spaceChunks, playTTS, playTTSChunks };
