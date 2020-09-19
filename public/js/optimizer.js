const socket = io();

let countdowns = {};

socket.on("connect", function() {
  console.log("connecting!");
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

  let box = document.getElementById(data.id);

  if (!document.getElementById(`subtitle-${data.id}`)) {
    let subT = document.createElement("div");
    subT.className = "bot-subtitle";
    subT.id = `subtitle-${data.id}`;

    // https://stackoverflow.com/a/39333479
    // https://stackoverflow.com/a/51401453
    const subData = Object.entries(
      (({id, model, run}) => ({id, model, run}))(data)
    ).join(" | ").replace(/,/g, ": ");
    subT.innerHTML = `${subData}`;

    const title = document.querySelector(`#title-${data.id}`);
    title.parentNode.insertBefore(subT, title.nextSibling);
  }

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

  let batch_messages = document.createElement("div");
  batch_messages.className = "bot-batch-messages";
  batch_messages.id = `batch-form-${id}`;

  // console.log("perplexities", perplexities);

  for (const i in chars) {

    let inputDiv = document.createElement("div");
    inputDiv.className = "batch-message-container";

    let seqDiv = document.createElement("div");

    let seq = document.createElement("div");
    seq.className = "batch-seq";
    seq.id = `batch-seq-${id}-${i}`;
    let l = document.createElement("div");
    // https://stackoverflow.com/a/29833199
    l.innerHTML = `<i>${("   " + perplexities[i][0].toFixed(2)).slice(-6)}</i> | `;
    let m = document.createElement("div");
    m.innerHTML += `${chars[i].trim()}<br>`;
    m.innerHTML += `${messages[i].trim().replace('\n', ' ')}`;
    seq.appendChild(l);
    seq.appendChild(m);

    seqDiv.appendChild(seq);

    inputDiv.appendChild(seqDiv);
    batch_messages.appendChild(inputDiv);

  }

  batch_controls.appendChild(batch_messages);

  // batchButton = document.createElement("button");
  // batchButton.className = "square-button batch-button";
  // batchButton.id = `batch-btn-${id}`;

  // if (data.countdown) {
  //   batchButton.classList.add("seconds-button");
  //   batchButton.innerHTML = `${data.seconds}`;
  //   addCountdown(id, data.seconds);
  // } else {
  //   batchButton.innerHTML = "send";
  // }

  btnsDiv = document.createElement("div");
  btnsDiv.className = "batch-btns-container";
  // btnsDiv.appendChild(againButton);
  // btnsDiv.appendChild(skipButton);
  // btnsDiv.appendChild(batchButton);

  batch_controls.appendChild(btnsDiv);
  let box = document.getElementById(id);
  box.appendChild(batch_controls);

});

socket.on("server confirms bot choice", data => {
  console.log("received choice data", data);
  let chosen = document.querySelector(`#batch-seq-${data.id}-${data.choice}`).parentNode;
  chosen.classList.add('flash');
  setTimeout(() => {
    chosen.classList.remove('flash');
  }, 1000);
});

