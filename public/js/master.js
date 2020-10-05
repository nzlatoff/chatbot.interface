import { removeUnusedBoxes } from './interactive-boxes.js';

const socket = io();

let countdowns = {};

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
    let title = document.createElement("div");
    title.className = "bot-title";
    title.id = `title-${botId}`;
    title.innerHTML = `<b>${data[botId].user}</b>`;
    box.appendChild(title);
    document.querySelector('.main-wrapper').appendChild(box);
  }
}

function submitConfig(form, data) {
  // console.log("class list before", setButton.classList);
  document.getElementById(data.id).querySelector('button').classList.add('flash');
  // console.log("class list after", setButton.classList);
  let formData = new FormData(form);
  for (const pair of formData.entries()) {
    if (["character", "hidden_before_char", "hidden_after_char"].includes(pair[0]) && !pair[1]) {
      document.querySelector(`#${pair[0]}-${data.id}`).placeholder = "";
      document.querySelector(`#${pair[0]}-${data.id}`).value = "";
      formData.set(pair[0], "");
    } else if (!pair[1]) {
      const pl = document.querySelector(`#${pair[0]}-${data.id}`).placeholder;
      document.querySelector(`#${pair[0]}-${data.id}`).value = pl;
      formData.set(pair[0], pl);
    } else {
      document.querySelector(`#${pair[0]}-${data.id}`).value = pair[1];
      document.querySelector(`#${pair[0]}-${data.id}`).placeholder = pair[1];
    }
    // console.log(`${pair[0]}-${data.id}: ${pair[1]}`);
  }
  formData = { id: data.id, ... Object.fromEntries(formData)};
  console.log("submitting config!");
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
  console.log('requesting new batch');
  skipMessage(id);
  socket.emit("new batch", { "id": id });
}

function skipMessage(id) {
  let batchButton = document.querySelector(`#batch-btn-${id}`);
  new Promise((res, rej) => {
    clearInterval(countdowns[id]);
    delete countdowns[id];
    res();
  }).then(() => {
    batchButton.classList.add("square-button-no-hover");
  }) .then(() => {
    console.log('skipping this batch...');
    socket.emit("master sends choice", { id: id, choice: -2 });
    let ic = document.createElement("i");
    ic.className = "fas fa-check";
    batchButton.innerHTML = "";
    batchButton.appendChild(ic);
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
  }) .then((choice) => {
    if (choice === undefined) {
      choice = -1;
      // console.log(`no message selected, returning control to bot.`);
    } else {
      console.log(`selecting message: ${choice}`);
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
  const sessDate = (new Date(sess)).toGMTString();
  // console.log("current sess:", sessDate);
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
    "temperature",
    "top_k",
    "top_p",
    "print_speed",
    "length_desired",
    "random_threshold",
    "rank_threshold",
    "wait_for_master",
    "sleepy_time",
    "patience",
  ];

  const textareaFields = [
    "character",
    "hidden_before_char",
    "hidden_after_char"
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
    (({id, model, run}) => ({id, model, run}))(data)
  ).join(" | ").replace(/,/g, ": ");
  subT.innerHTML = `${subData} | (<small>ctrl+enter pour envoyer</small>)`;

  for (const el in data) {

    let wrapper = document.createElement("wrapper");
    wrapper.className = `input-wrapper ${el}-wrapper`;

    let input;
    if (numbersFields.includes(el)) {
      input = document.createElement("input");
    } else if (textareaFields.includes(el)) {
      input = document.createElement("textarea");
      if (el === "character") input.rows = 1;
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

    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "Enter" || e.keyCode === 13)) {
        submitConfig(form, data);
      }
    });

    let inputLabel = document.createElement("label");
    inputLabel.htmlFor = input.id;
    inputLabel.innerHTML = `${el.replace(/_/g, " ")}:`;

    let labelDiv =  document.createElement("div");

    labelDiv.appendChild(inputLabel);
    wrapper.appendChild(labelDiv);
    wrapper.appendChild(input);

    if (numbersFields.includes(el)) {
      labelDiv.className = "numbers-label-wrapper";
      numbersBox.appendChild(wrapper);
    } else {
      labelDiv.className = "texts-label-wrapper";
      textsBox.appendChild(wrapper);
    }

  }

  const title = document.querySelector(`#title-${data.id}`);
  title.parentNode.insertBefore(subT, title.nextSibling);

  form.appendChild(numbersBox);
  form.appendChild(textsBox);

  let againButton = document.createElement("button");
  againButton.className = "square-button again-button";
  againButton.id = `again-btn-${data.id}`;
  againButton.innerHTML = "gen!";

  let setButton = document.createElement("button");
  setButton.className = "square-button set-button";
  setButton.innerHTML = "set";

  let BotBtns = document.createElement("div");
  BotBtns.className = "batch-btns-wrapper";
  BotBtns.appendChild(againButton);
  BotBtns.appendChild(setButton);

  botControls.appendChild(BotBtns);

  againButton.addEventListener("click", (e) => {
    // console.log("inside event listener", e);
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
});

socket.on("received batch", data => {

  // console.log("received batch");

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

    let labDiv = document.createElement("div");

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

    labDiv.appendChild(label);

    inputDiv.appendChild(inp);
    inputDiv.appendChild(labDiv);
    batch_messages_form.appendChild(inputDiv);

  }

  batch_controls.appendChild(batch_messages_form);

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
  batchBtns.className = "batch-btns-wrapper";
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
  let chosen = document.querySelector(`#batch-input-${data.id}-${data.choice}`).parentNode;
  chosen.classList.add('flash');
  setTimeout(() => {
    chosen.classList.remove('flash');
  }, 1000);
});

document.getElementById('save-button').addEventListener('click', (e) => {
  // console.log('saving current sess');
  window.open('/chats', '_blank');
});

document.querySelector("#archives-button").addEventListener("click", () => {
  window.open('/archive', "_blank");
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
