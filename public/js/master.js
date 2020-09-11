const socket = io();

socket.on("connect", function() {
  console.log("connecting!");
  socket.emit("new master");
  socket.emit("get bot list");
});

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
    document.body.appendChild(box);
  }
}

async function deleteUnusedBoxes(data) {
  document.querySelectorAll(".bot-wrapper").forEach(el => {
    if (!(el.id in data)) {
      el.remove();
    }
  });
}

function submitConfig(form, data) {
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
}

socket.on("bots list", data => {
  createBotBoxes(data)
   .then(deleteUnusedBoxes(data))
    .then(socket.emit("get session"))
    .then(socket.emit("master wants bot config"));
});

socket.on("current session", sess => {
  let masthead = document.getElementById("masthead-box");
  const currentSess = masthead.querySelector("#sess-id");
  // console.log("current sess:", currentSess);
  if (!currentSess) {
    let sessWrapper = document.createElement("div");
    sessWrapper.id = "sess-wrapper";
    let sessTitle = document.createElement("div");
    sessTitle.innerHTML = `Current Session:`;
    let sessDiv = document.createElement("div");
    sessDiv.id = "sess-id";
    sessDiv.innerHTML = sess;
    sessWrapper.prepend(sessDiv);
    sessWrapper.prepend(sessTitle);
    masthead.prepend(sessWrapper);
  } else if (sess != currentSess.innerText) {
    if (sess != currentSess) {
      currentSess.innerText = sess;
    }
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
    "wait_for_master"
  ];

  const textareaFields = [
    "character",
    "hidden_before_char",
    "hidden_after_char"
  ];

  let box = document.getElementById(data.id);

  if (box.getElementsByClassName("bot-controls").length != 0) {
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
  subT.innerHTML = `${subData}`;

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

  setButton = document.createElement("button");
  setButton.className = "square-button set-button";
  setButton.innerHTML = "set";
  setButton.addEventListener("click", () => {
    submitConfig(form, data);
  });
  botControls.appendChild(setButton);

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
  batch_messages_form.id = `batch-${id}`;

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

  let seconds = data["seconds"];
  secondsButton = document.createElement("button");
  secondsButton.className = "square-button seconds-button";
  secondsButton.id = `seconds-${id}`;
  secondsButton.innerHTML = `${seconds}`;

  batch_controls.appendChild(secondsButton);

  let box = document.getElementById(id);
  box.appendChild(batch_controls);

  const countdown = addCountdown(id, seconds);

  secondsButton.addEventListener("click", (e) => {
    // console.log("inside event listener", e);
    submitMessage(id, countdown);
  }, {once: true} );

});

function addCountdown(id, seconds) {
  // console.log("about to create new countdown for bot:", id);
  const countdown = setInterval(() => {
    if (seconds <= 1) {
      // console.log("clearing interval:", countdown);
      submitMessage(id, countdown);
    } else {
      // console.log("interval:", countdown, "at second:", seconds);
      seconds--;
      document.querySelector(`#seconds-${id}`).innerText = seconds;
    }
  }, 1000);
  return countdown;

}

async function checkRadio(form) {
  let choice;
  for (let i = 0; i < form.length; i++) {
    if (form[i].checked) {
      choice = i;
      break;
    }
  }
  return choice;
}

function submitMessage(id, countdown) {

  console.log("about to enter chain");
  let secondsButton = document.querySelector(`#seconds-${id}`);
  new Promise((res, rej) => {
    clearInterval(countdown);
    res();
  }).then(() => {
    console.log("id is now", id);
    secondsButton.classList.add("square-button-no-hover");
  }).then(() => {
    console.log("id is now", id);
    return checkRadio(document.querySelector(`#batch-${id}`));
  }) .then((choice) => {
    if (choice === undefined) {
      choice = -1;
      console.log(`no message selected, returning control to bot.`);
    } else {
      console.log(`selecting message: ${choice}`);
    }
    socket.emit("master sends choice", { id: id, choice: choice});
    ic = document.createElement("i");
    ic.className = "fas fa-check";
    secondsButton.innerHTML = "";
    secondsButton.appendChild(ic);
  });

}

document.querySelector("#reset-button").addEventListener("click", () => {
  console.log("resetting!");
  socket.emit("reset session");
  socket.emit("get session");
});

