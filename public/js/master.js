const socket = io();

socket.on("connect", function() {
  console.log("connecting");
  socket.emit("client wants bot list");
});

async function createBotBoxes(data) {
  console.log("bots list", data);
  for (botId in data) {
    console.log(`creating box for ${botId}: ${data[botId].user}`);
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
      console.log("removing:");
      console.log(el);
      el.remove();
    }
  });
}

socket.on("bots list", data => {
  createBotBoxes(data)
   .then(deleteUnusedBoxes(data))
    .then(socket.emit("client wants bot config"));
});

socket.on("bot config from server", data => {

  console.log("bot config from server:", data);

  let botControls = document.createElement("div");
  botControls.className = "bot-controls";

  let descr = document.createElement("div");
  descr.className = "bot-description";
  botControls.appendChild(descr);

  let form = document.createElement("form");
  form.className = "bot-form";
  botControls.appendChild(form);

  let box = document.querySelector(`#${data.id}`);
  box.appendChild(botControls);

  for (el in data) {

    if (["id", "user"].includes(el)) {
      continue;
    } 
    
    if (["model", "run"].includes(el)) {

      let info = document.createElement("div");
      info.innerHTML = `${el.charAt(0).toUpperCase()}${el.slice(1)}: ${data[el]}`; 
      descr.appendChild(info);
      // descr.appendChild(document.createElement("br"));

      continue;
    } 

    let input = document.createElement("input");
    input.type = "text";
    input.id = el;
    input.name = el;
    input.placeholder = data[el];

    let inputLabel = document.createElement("label");
    inputLabel.htmlFor = input.id;
    inputLabel.innerHTML = `${el.charAt(0).toUpperCase()}${el.slice(1)}: `;

    form.appendChild(inputLabel);
    form.appendChild(input);
    form.innerHTML += "<br>";

  }

  setButton = document.createElement("button");
  setButton.className = "square-button set-button";
  setButton.innerHTML = "set";
  botControls.appendChild(setButton);


});

socket.on("bot left", data => {
  console.log("bot left!", data);
  document.querySelectorAll(".bot-wrapper").forEach(el => {
    if (el.id == data.id) {
      console.log("removing:");
      console.log(el);
      el.remove();
    }
  });
});

$("#reset-button").click(function() {
  console.log("resetting!");
  socket.emit("reset session");
});

