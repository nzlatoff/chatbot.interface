const socket = io();

socket.on("connect", function() {
  console.log("connecting!");
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
    title.className = "bot-name";
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
    "id",
    "run",
    "model",
    "temperature",
    "top_k",
    "top_p",
    "print_speed",
    "length_desired",
    "random_threshold",
    "rank_threshold"
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

  for (const el in data) {

    if (el === "user") {
      continue;
    }

    let wrapper = document.createElement("wrapper");
    wrapper.className = `input-wrapper ${el}-wrapper`;

    let input;
    if (numbersFields.includes(el)) {
      input = document.createElement("input");
    } else {
      input = document.createElement("textarea");
      if (el === "character") input.rows = 1;
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

document.querySelector("#reset-button").addEventListener("click", () => {
  console.log("resetting!");
  socket.emit("reset session");
});

