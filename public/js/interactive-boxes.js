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

// TTS ----------------------------------------

function cleanTTS(msg) {
  return msg
    .replace(/\n/g, " ")
    .replace(/(\(| _)/g, " parenthèse ouverte ")
    .replace(/(\)|_[ ,.?;:!])/g, " parenthèse fermée ")
    .toLowerCase();
}

// https://stackoverflow.com/a/274094
String.prototype.regexLastIndexOf = function(regex, startpos) {
  regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
  if(typeof(startpos) === "undefined") {
    startpos = this.length;
  } else if (startpos < 0) {
    startpos = 0;
  }
  const stringToWorkWith = this.substring(0, startpos + 1);
  let lastIndexOf = -1;
  let nextStop = 0;
  let result = regex.exec(stringToWorkWith);
  while(result != null) {
    lastIndexOf = result.index;
    regex.lastIndex = ++nextStop;
    result = regex.exec(stringToWorkWith)
  }
  return lastIndexOf;
}

function punctChunks(msg, maxLen=50) {
  let chunks = [];
  let total = msg.length;
  while (total > maxLen) {
    let tmp = msg.slice(0, maxLen);
    let lastSpaceInd = tmp.regexLastIndexOf(/[,.;:?!]/);
    if (lastSpaceInd < 1) {
      lastSpaceInd = tmp.lastIndexOf(" ");
    }
    tmp = tmp.slice(0, lastSpaceInd + 1);
    chunks.push(tmp);
    msg = msg.slice(lastSpaceInd + 1);
    total = msg.length;
    console.log('tmp: ', tmp, ' | msg now:', msg);
  }
  chunks.push(msg);
  // console.log(chunks);
  return chunks;
}

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
    if (text === '$$BEEP$$') {
      const a = new Audio(`../assets/beep.mp3`);
      a.volume = 0.1;
      playEls.push(a);
    } else {
      // Get the audio element
      // const audioEl = document.createElement('audio');
      // const url= `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`;
      const audioEl = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${text}`);
      // add the sound to the audio element
      audioEl.playbackRate = speed;
      //For auto playing the sound
      playEls.push(audioEl);
    }
  }

  // https://stackoverflow.com/a/36720740
  for (let i = 0; i < playEls.length - 1; i++) {
    playEls[i].addEventListener('timeupdate', function() {
      // console.log(`at time ${this.currentTime} of element ${i} (total duration: ${this.duration}`);
      // let buffer = ((this.duration > 2) ? .75 : .3);
      if (this.currentTime > this.duration - .3) {
        // console.log('at ', this.currentTime, ' | total: ', this.duration);
        playEls[i].pause();
        playEls[i + 1].play();
        playEls[i].remove();
      }
    });
  }

  return new Promise((err, res) => {
    playEls[0].play()
  });
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

function beep() {
  const audioEl = new Audio(`../assets/beep.mp3`);
  // add the sound to the audio element
  //For auto playing the sound
  return new Promise((err, res) => {
    audioEl.play();
    audioEl.remove();
  });
}

export {
  createInteractiveBox,
  removeUnusedBoxes,
  clearUser,
  filterBot,
  emptyBoxes,
  cleanTTS,
  punctChunks,
  spaceChunks,
  playTTSChunks,
  playTTS,
  beep
};
