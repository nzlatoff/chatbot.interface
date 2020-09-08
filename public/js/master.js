const socket = io();

socket.on("connect", function() {
  console.log("connecting!");
  socket.emit("new master");
  socket.emit("master wants bot list");
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
    if (["character", "hidden_end_of_line", "start_of_line"].includes(pair[0]) && !pair[1]) {
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
    .then(socket.emit("master wants bot config"));
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
    "rank_threshold"
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
  socket.emit("master wants bot list");
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

  const minPerp = Math.min(...perplexities);

  for (const i in chars) {

    let inputDiv = document.createElement("div");
    inputDiv.className = "batch-message-container";

    let inp = document.createElement("input");
    inp.className = "batch-message";
    inp.setAttribute("type", "radio");
    inp.id = `batch-input-${i}`;
    inp.name = `batch-input`;
    inp.setAttribute("value", i);
    if (perplexities[i][0] === minPerp) {
      inp.checked = true;
    }

    let labDiv = document.createElement("div");
    labDiv.className = "batch-label-container";

    let lab = document.createElement("label");
    lab.id = `batch-label-${i}`;
    lab.htmlFor = `batch-message-${i}`;
    lab.innerHTML = `<i>${perplexities[i][0].toFixed(3)}</i><br>`;
    lab.innerHTML += `${chars[i].trim()}<br>`;
    lab.innerHTML += `${messages[i].trim().replace('\n', '<br>')}`;

    labDiv.appendChild(lab);
    inputDiv.appendChild(inp);
    inputDiv.appendChild(labDiv);
    batch_messages_form.appendChild(inputDiv);

  }

  let counterDiv = document.createElement("div");
  counterDiv.className = "counter-seconds";
  let seconds = 0;
  counterDiv.innerText = `${seconds}`;

  batch_controls.appendChild(batch_messages_form);
  batch_controls.appendChild(counterDiv);

  let box = document.getElementById(id);
  box.appendChild(batch_controls);

  const countdown = setInterval(() => {
    seconds--;
    counterDiv.innerText = seconds;
    if (seconds <= 0) {
      clearInterval(countdown);
      let i;
      for (i = 0; i < batch_messages_form.length; i++) {
        if (batch_messages_form[i].checked) break;
      }
      console.log(`The selected message is number: ${i+1}`);
      socket.emit("master sends choice", { id: id, choice: i});
      ic = document.createElement("i");
      ic.className = "fas fa-check";
      counterDiv.innerHTML = "";
      counterDiv.appendChild(ic);
    }
  }, 1000);

});

document.querySelector("#reset-button").addEventListener("click", () => {
  console.log("resetting!");
  socket.emit("reset session");
});

