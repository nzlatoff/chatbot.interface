var socket = io();
  socket.on('connect', function (data) {
  // send the username to the server
  socket.emit("new user", str_obj(document.cookie).userData)
});

var messages = document.getElementById("messages");

// util function to parse local cookie
function str_obj(str) {
  str = str.split('; ');
  var result = {};
  for (var i = 0; i < str.length; i++) {
      var cur = str[i].split('=');
      result[cur[0]] = cur[1];
  }
  return result;
}

$("#refreshUserList").submit(function(e){
  e.preventDefault();
  console.log("refresh button pressed.");
  refreshUserList();
});

// new message entered or received
(function() {
  // sending new message
  $("#send-form").submit(function(e) {
    console.log("send button pressed.");
    //get UserName from the Cookie
    userName = str_obj(document.cookie).userData
    
    let li = document.createElement("li");
    e.preventDefault(); // prevents page reloading
    //socket.emit("chat message", $("#message").val()); // Anonymous message (original version)
    socket.emit("chat message2", { message:$("#message").val(), sender: userName});

    messages.appendChild(li).append($("#message").val());
    let span = document.createElement("span");

    messages.appendChild(span).append("by " + userName + ": " + "just now");

    $("#message").val("");

    return false;
  });
  
  // new message received
  socket.on("received", data => {
    let li = document.createElement("li");
    let span = document.createElement("span");
    var messages = document.getElementById("messages");
    messages.appendChild(li).append(data.message.message);
    messages.appendChild(span).append("by " + data.sender + ": " + "just now");
    document.getElementById(socket.id).value = '';
    console.log("Hello bingo!"+data.message.message );
  });
})();

// fetching initial chat messages from the database
(function() {
  datefrom = new Date().toISOString().substring(0,10); // just print today's message by default
  fetch("/chats?datefrom="+datefrom)
   .then(data => {
      return data.json();
    })
    .then(json => {
      json.map(data => {
        let li = document.createElement("li");
        let span = document.createElement("span");
        messages.appendChild(li).append(data.message);
        messages
          .appendChild(span)
          .append("by " + data.sender + ": " + formatTimeAgo(data.createdAt));
      });
    });
})();

// fetching initial connected users from the server
function refreshUserList() {
  fetch("/users")
    .then(data => {
      if (!data.ok) {
        throw new Error(`HTTP error! status: ${data.status}`);
      } else {
        let ret = data.json(); 
        return ret;
      }
    })
    .then(json => {
      users.innerText = '';
      json.map(data => {
        let li = document.createElement("li");
        //let span = document.createElement("span");
        let text = document.createElement("textarea");
        text.id = data.id; 
        text.cols = 120;
        users.appendChild(li).append(data.user);
        users.appendChild(text);
        //  .appendChild(span)
        //  .append("id: " + data.id);
      });
    });
}
setTimeout(function(){ refreshUserList(); }, 200); //needs a delay for the server to add the new connection (this client)

//is typing...
let messageInput = document.getElementById("message");
let typing = document.getElementById("typing");

//isTyping event
messageInput.addEventListener("keypress", () => {
  socket.emit("typing", { user: str_obj(document.cookie).userData, message: messageInput.value });
});

socket.on("notifyTyping", data => {
  typing.innerText = data.user + " " + data.message;
  console.log('trying to get element with id:'+socket.id);
  document.getElementById(socket.id).value = data.message;

});

//stop typing
messageInput.addEventListener("keyup", () => {
  socket.emit("stopTyping", "");
});

socket.on("notifyStopTyping", () => {
  typing.innerText = "";

});


