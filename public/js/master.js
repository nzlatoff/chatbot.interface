import { removeUnusedBoxes } from './interactive-boxes.js';

const socket = io();

let countdowns = {};
let batch_sizes = {};

function flashBtn(btn, id, fade=true) {
  btn.classList.add('flash');
  setTimeout(() => {
    btn.classList.remove('flash');
  }, 1000);
  if (fade) {
    setTimeout(() => {
      $(`#${id} .batch-controls`).children().fadeOut(500);
    }, 500);
  }
}

async function createBotBoxes(data) {
  // console.log("bots list", data);
  for (const botId in data) {

    // console.log(`creating box for ${botId}: ${data[botId].user}`);

    if (document.getElementById(botId)) {
      continue;
    }

    let box = document.createElement("div");
    box.id = botId;
    box.className = "box-wrapper bot-wrapper";
    let titleW = document.createElement("div");
    titleW.id = `title-wrapper-${botId}`;
    titleW.className = "bot-title-wrapper";
    let title = document.createElement("div");
    title.className = "bot-title";
    title.id = `title-${botId}`;
    title.innerHTML = `<b>${data[botId].user}</b>`;
    let titleId = document.createElement("small");
    titleId.innerHTML = `(${botId})`;
    title.append(titleId)
    titleW.append(title);
    box.appendChild(titleW);
    document.querySelector('#bots-wrapper').appendChild(box);
  }
}

function submitConfig(form, data) {
  // console.log("class list before", setButton.classList);
  document.getElementById(data.id).querySelector('.set-button').classList.add('flash');
  // console.log("class list after", setButton.classList);
  let formData = new FormData(form);
  for (const pair of formData.entries()) {
    // console.log(pair);
    // character is empty (reset)
    if (["character"].includes(pair[0]) && !pair[1]) {
      document.querySelector(`#${pair[0]}-${data.id}`).placeholder = "";
      document.querySelector(`#${pair[0]}-${data.id}`).value = "";
      formData.set(pair[0], "");
    // for subtext and first words, don't store anything
    } else if (["subtext", "first_words"].includes(pair[0])){
      document.querySelector(`#${pair[0]}-${data.id}`).value = "";
      document.querySelector(`#${pair[0]}-${data.id}`).placeholder = "";
    // case for batch size (which resets text fields)
    } else if ("batch_size" === pair[0]) {
      // console.log(`former batch size ${batch_sizes[data.id]}, current: ${pair[1]}`);
      if (pair[1] != batch_sizes[data.id]) {
        // in case there's a countdown in progress
        if (data.id in countdowns) {
          skipMessage(data.id);
        }
      }
      batch_sizes[data.id] = pair[1];
    } else {
      document.querySelector(`#${pair[0]}-${data.id}`).value = pair[1];
      document.querySelector(`#${pair[0]}-${data.id}`).placeholder = pair[1];
    }
    // console.log(`${pair[0]}-${data.id}: ${pair[1]}`);
  }
  formData = { id: data.id, ... Object.fromEntries(formData)};
  // console.log("submitting config!");
  // console.log(formData);
  socket.emit("master sets bot config", formData);
  setTimeout(() => {
    document.getElementById(data.id).querySelector('button').classList.remove('flash');
  }, 1000);
}

function addCountdown(id, seconds) {
  // console.log("about to create new countdown for bot:", id);
  countdowns[id] = setInterval(() => {
    if (seconds <= 1) {
      // console.log("clearing interval:", countdowns[id]);
      submitMessage(id);
    } else {
      // console.log("interval:", countdowns[id], "at second:", seconds);
      seconds--;
      document.querySelector(`#batch-btn-${id}`).innerText = seconds;
    }
  }, 1000);
}

async function checkRadio(id) {
  const form = document.querySelector(`#batch-form-${id}`);
  let choice;
  for (let i = 0; i < form.length; i++) {
    if (form[i].checked) {
      choice = i;
      break;
    }
  }
  return choice;
}

function newBatch(id) {
  // console.log('requesting new batch');
  if (countdowns[id]) {
    // console.log('found count down, skipping current batch');
    skipMessage(id)
      .then(() => {
        // console.log('about to request new batch');
        setTimeout(() => socket.emit("new batch", { "id": id }), 1000);
      });
  } else {
    // console.log('about to request new batch, nothing to reset');
    socket.emit("new batch", { "id": id });
  }
}

function skipMessage(id) {
  return new Promise((res, rej) => {
    // console.log(`skipping message for ${id}`);
    clearInterval(countdowns[id]);
    delete countdowns[id];
    res();
  }).then(() => {
    let batchButton = document.querySelector(`#batch-btn-${id}`);
    batchButton.classList.add("square-button-no-hover");
    return batchButton
  }).then((batchButton) => {
    // console.log('about to send request to skip this batch...');
    socket.emit("master sends choice", { id: id, choice: -2 });
    let ic = document.createElement("i");
    ic.className = "fas fa-check";
    batchButton.innerHTML = "";
    batchButton.appendChild(ic);
  }).then(() => {
    setTimeout(() => {
      $(`#${id} .batch-controls`).children().fadeOut(500);
    }, 500);
  });
}

function submitMessage(id) {
  // console.log("about to enter chain");
  let batchButton = document.querySelector(`#batch-btn-${id}`);
  new Promise((res, rej) => {
    clearInterval(countdowns[id]);
    delete countdowns[id];
    res();
  }).then(() => {
    batchButton.classList.add("square-button-no-hover");
  }).then(() => {
    return checkRadio(id);
  }).then((choice) => {
    if (choice === undefined) {
      choice = -1;
      // console.log(`no message selected, returning control to bot.`);
    } else {
      // console.log(`selecting message: ${choice}`);
    }
    socket.emit("master sends choice", { id: id, choice: choice});
    let ic = document.createElement("i");
    ic.className = "fas fa-check";
    batchButton.innerHTML = "";
    batchButton.appendChild(ic);
  });
}

socket.on("connect", function() {
  console.log("connecting!");
  socket.emit("new master");
  socket.emit("get bot list");
});

socket.on("bots list", data => {
  createBotBoxes(data)
    .then(removeUnusedBoxes('.bot-wrapper', data))
    .then(socket.emit("get session"))
    .then(socket.emit("master wants bot config"));
});

socket.on("current session", sess => {
  let masthead = document.getElementById("masthead-box");
  const currentSess = masthead.querySelector("#sess-id");
  let sessDate;
  if (sess) {
    sessDate = (new Date(sess)).toGMTString();
  } else {
    sessDate = "(no session)";
  }
  // console.log("current sess:", sessDate, sess);
  if (!currentSess) {
    let sessWrapper = document.createElement("div");
    sessWrapper.id = "sess-wrapper";
    let sessTitle = document.createElement("div");
    sessTitle.innerHTML = `Current Session:`;
    let sessDiv = document.createElement("div");
    sessDiv.id = "sess-id";
    sessDiv.innerHTML = sessDate;
    sessWrapper.prepend(sessDiv);
    sessWrapper.prepend(sessTitle);
    masthead.prepend(sessWrapper);
  } else if (sessDate != currentSess.innerText) {
    currentSess.innerText = sessDate;
  }
});

socket.on("bot config from server", data => {

  // console.log("bot config from server:", data);

  const numbersFields = [
    "rank_threshold",
    "length_desired",
    "batch_size",
    "temperature",
    "patience",
    "silence",
    "pause",
    "wait",
    "tempo",
    "top_p",
    "top_k",
  ];

  const textareaFields = [
    "character",
    "subtext",
    "first_words"
  ];

  const optionsFields = [
    "mode",
  ];

  let box = document.getElementById(data.id);

  if (!box || box.getElementsByClassName("bot-controls").length != 0) {
    return;
  }

  let botControls = document.createElement("div");
  botControls.className = "bot-controls";

  let form = document.createElement("form");
  form.className = "bot-form";
  botControls.appendChild(form);

  box.appendChild(botControls);

  let numbersBox = document.createElement("div");
  numbersBox.className = "numbers-inputs-wrapper";
  let textsBox = document.createElement("div");
  textsBox.className = "texts-inputs-wrapper";

  let subT = document.createElement("div");
  subT.className = "bot-subtitle";
  subT.id = `subtitle-${data.id}`;

  // https://stackoverflow.com/a/39333479
  // https://stackoverflow.com/a/51401453
  const subData = Object.entries(
    (({model, run}) => ({model, run}))(data)
  ).join(" | ").replace(/,/g, ": ");
  document.querySelector(`#title-wrapper-${data.id}`).innerHTML +=  `<small>${subData}</small>`
  // subT.innerHTML = `${subData}`;

  // special case for batch size
  batch_sizes[data.id] = data.batch_size;

  for (const el in data) {

    let wrapper = document.createElement("wrapper");
    wrapper.className = `input-wrapper ${el}-wrapper`;

    let input;
    if (numbersFields.includes(el)) {
      input = document.createElement("input");
    } else if (textareaFields.includes(el)) {
      input = document.createElement("textarea");
      if (["character", "first_words"].includes(el)) input.rows = 1;
      if (el === "subtext") input.rows = 6;
    } else if (optionsFields.includes(el)) {
      input = document.createElement("select");
      const opt1 = document.createElement("option");
      opt1.innerHTML = "reactive";
      opt1.value = "reactive";
      const opt2 = document.createElement("option");
      opt2.innerHTML = "autonomous";
      opt2.value = "autonomous";
      input.appendChild(opt1);
      input.appendChild(opt2);
      input.selectedIndex = data.mode === "reactive" ? 0 : 1;
    } else {
      continue;
    }

    input.id = `${el}-${data.id}`;
    input.name = el;

    if (["model", "run", "id"].includes(el)) {
      input.setAttribute("value", data[el]);
      input.disabled = true;
    } else {
      input.setAttribute("value", data[el]);
      input.placeholder = data[el];
    }

    // ctrl+enter for set, alt+enter for gen!
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "Enter" || e.keyCode === 13)) {
        flashBtn(document.querySelector(`#set-btn-${data.id}`), data.id, false);
        submitConfig(form, data);
      }
      if (e.altKey && (e.key === "Alt" || e.keyCode === 13)) {
        flashBtn(document.querySelector(`#gen-btn-${data.id}`), data.id);
        // submitConfig(form, data);
        newBatch(data.id);
      }
    });

    let inputLabel = document.createElement("label");
    inputLabel.htmlFor = input.id;
    inputLabel.innerHTML = `${el.replace(/_/g, " ")}:`;

    let labelDiv =  document.createElement("div");

    labelDiv.appendChild(inputLabel);
    wrapper.appendChild(labelDiv);
    wrapper.appendChild(input);

    if ([...numbersFields, ...optionsFields].includes(el)) {
      labelDiv.className = "numbers-label-wrapper";
      numbersBox.appendChild(wrapper);
    } else {
      labelDiv.className = "texts-label-wrapper";
      textsBox.appendChild(wrapper);
    }

  }

  const title = document.querySelector(`#title-${data.id}`);

  form.appendChild(numbersBox);
  form.appendChild(textsBox);

  let genButton = document.createElement("button");
  genButton.className = "square-button gen-button";
  genButton.id = `gen-btn-${data.id}`;
  genButton.innerHTML = "gen!";

  let setButton = document.createElement("button");
  setButton.className = "square-button set-button";
  setButton.id =  `set-btn-${data.id}`;
  setButton.innerHTML = "set";

  let botBtns = document.createElement("div");
  botBtns.className = "btns-wrapper";
  botBtns.id = "bot-btns-wrapper";
  botBtns.appendChild(genButton);
  botBtns.appendChild(setButton);

  botControls.appendChild(botBtns);

  genButton.addEventListener("click", (e) => {
    // console.log("inside event listener", e);
    // submitConfig(form, data);
    newBatch(data.id);
  });

  setButton.addEventListener("click", () => {
    submitConfig(form, data);
  });

});

socket.on("new bot", data => {
  socket.emit("get bot list");
});

socket.on("bot left", data => {
  // console.log("bot left!", data);
  document.querySelectorAll(".bot-wrapper").forEach(el => {
    if (el.id == data.id) {
      // console.log("removing:");
      // console.log(el);
      el.remove();
    }
  });
  delete countdowns[data.id];
  delete batch_sizes[data.id];
});

socket.on("received batch", data => {

  // console.log("received batch", data);

  const { id, chars, messages, perplexities } = data;

  let batch_controls = document.getElementById(id).querySelector('.batch-controls');
  if (!batch_controls) {
    batch_controls = document.createElement("div");
    batch_controls.className =  "batch-controls";
  } else {
    batch_controls.innerHTML = "";
  }

  let batch_messages_form = document.createElement("form");
  batch_messages_form.className = "bot-batch-messages-form";
  batch_messages_form.id = `batch-form-${id}`;

  // console.log("perplexities", perplexities);

  for (const i in chars) {

    let inputDiv = document.createElement("div");
    inputDiv.className = "batch-message-container";

    let inp = document.createElement("input");
    inp.className = "batch-message";
    inp.setAttribute("type", "radio");
    inp.id = `batch-input-${id}-${i}`;
    inp.name = `batch-input`;
    inp.setAttribute("value", i);

    let label = document.createElement("label");
    label.className = "batch-label";
    label.id = `batch-label-${id}-${i}`;
    label.htmlFor = `batch-input-${id}-${i}`;
    let l = document.createElement("div");
    // https://stackoverflow.com/a/29833199
    l.innerHTML = `<i>${("   " + perplexities[i][0].toFixed(2)).slice(-6)}</i> | `;
    let m = document.createElement("div");
    m.innerHTML += `${chars[i].trim()}<br>`;
    m.innerHTML += `${messages[i].trim().replace('\n', ' ')}`;
    label.appendChild(l);
    label.appendChild(m);

    inputDiv.appendChild(inp);
    inputDiv.appendChild(label);
    batch_messages_form.appendChild(inputDiv);

    // https://stackoverflow.com/q/19895073/9638108
    inp.addEventListener("click", (e) => {
      // https://stackoverflow.com/a/53939059/9638108
      if (e.detail === 1) {
        // console.log('checked?', e.target.checked, e.target);
        if (e.target.wasChecked) {
          e.target.wasChecked = false;
          e.target.checked = false;
        } else {
          e.target.wasChecked = true;
          e.target.checked = true;
        }
      }
    });

  }

  batch_controls.appendChild(batch_messages_form);

  batch_messages_form.addEventListener('dblclick', (e) => {
    submitMessage(id);
  }, {once: true});

  let skipButton = document.createElement("button");
  skipButton.className = "square-button skip-button";
  skipButton.id = `skip-btn-${id}`;
  skipButton.innerHTML = "skip";

  let batchButton = document.createElement("button");
  batchButton.className = "square-button batch-button";
  batchButton.id = `batch-btn-${id}`;

  if (data.countdown) {
    batchButton.classList.add("seconds-button");
    batchButton.innerHTML = `${data.seconds}`;
    addCountdown(id, data.seconds);
  } else {
    batchButton.innerHTML = "send";
  }

  let batchBtns = document.createElement("div");
  batchBtns.className = "btns-wrapper";
  batchBtns.id = "batch-btns-wrapper";
  batchBtns.appendChild(skipButton);
  batchBtns.appendChild(batchButton);

  batch_controls.appendChild(batchBtns);
  let box = document.getElementById(id);
  box.appendChild(batch_controls);

  batchButton.addEventListener("click", (e) => {
    // console.log("inside event listener", e);
    submitMessage(id);
  }, {once: true} );

  skipButton.addEventListener("click", (e) => {
    // console.log("inside event listener", e);
    skipMessage(id);
  }, {once: true} );

});

socket.on("server confirms bot choice", data => {
  // console.log("received choice data", data);
  flashBtn(document.querySelector(`#batch-input-${data.id}-${data.choice}`).parentNode, data.id);
});

document.getElementById('save-button').addEventListener('click', (e) => {
  // console.log('saving current sess');
  window.open('/chats', '_blank');
});

document.querySelector("#archives-button").addEventListener("click", () => {
  window.open('/archive', "_blank");
});

document.querySelector("#mecha-button").addEventListener("click", () => {
  window.open('/mechanism', "_blank");
});

document.querySelector("#reset-button").addEventListener("click", () => {
  console.log("resetting!");
  Array.from(document.getElementsByClassName("batch-controls")).forEach((e) => e.remove());
  for (const id in countdowns) {
    clearInterval(countdowns[id]);
  }
  socket.emit("reset session");
  socket.emit("get session");
});
