const socket = io();

let currentMessages;
let currentSession;

socket.on("connect", function() {
  console.log("connecting!");
  socket.emit('get archives sessions');
});

async function fillSessions(data) {
  // console.log("sessions list", data);
  for (const sess of data) {
    new Promise((res, rej) => {
      const date = new Date(sess._id)
      dateString = date.toGMTString();
      // console.log(`creating box for ${dateString} (${sess.count} messages).`);
      let sessDiv = document.createElement("div");
      sessDiv.id = sess._id;
      sessDiv.className = "session-list";
      sessDiv.innerHTML = `${dateString} | messages: ${sess.count}`;
      document.querySelector('#sessions-wrapper').appendChild(sessDiv);
      res();
    }).then(() => {
      document.getElementById(sess._id).addEventListener("click", () => {
        currentSession = sess._id;
        // console.log("getting session messages for", sess._id);
        $('#current-session').empty();
        socket.emit("get session messages", sess._id);
      });
    });
  }
}


socket.on('archives sessions', (data) => {
  // console.log(`received all ${data.length} sessions found`);
  const ts = document.querySelector('#title-n-sessions');
  if (!ts) {
    const nSess = document.createElement('div');
    nSess.id = 'title-n-sessions';
    nSess.innerHTML = `(${data.length} sessions in database)`;
    document.querySelector('#title-wrapper').appendChild(nSess);
  }
  fillSessions(data);
});

socket.on("session messages", (data) => {
  // console.log("received messages", data.messages);
  currentMessages = data.messages;
  new Promise((res, rej) => {
    $('#sessions-wrapper').fadeOut();
    $('#current-session-wrapper').css("display", "flex").fadeIn();
    res();
  }).then(() => {
    let sess = document.querySelector('#current-session');
    sessTitle = document.createElement('div');
    sessTitle.id = "current-session-title";
    sessDate = new Date(data.session).toGMTString();
    sessTitle.innerHTML = `<i>${sessDate}</i>`;
    sess.appendChild(sessTitle);
    for (const msg of data.messages) {
      let msgDiv = document.createElement('div');
      msgDiv.className = "message";
      const h = (new Date(msg.createdAt)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
      let info = document.createElement('small');
      info.className = "message-info";
      info.innerHTML = `<i> (${msg.user}, ${h})</i>`;
      if (msg.character) {
        msgDiv.innerHTML = `${msg.character}`;
        msgDiv.appendChild(info);
        msgDiv.innerHTML += `<br>${msg.message}`;
      } else {
        msgDiv.innerHTML = msg.message;
        msgDiv.appendChild(info);
      }
      sess.appendChild(msgDiv);
    }
  });
});

document.querySelector("#all-button").addEventListener("click", () => {
  // console.log("requesting all archives");
  window.open('/archives', '_blank').focus();
});

document.querySelector("#back-button").addEventListener("click", () => {
  currentMessages = null;
  currentSession = null;
  $('#current-session-wrapper').fadeOut();
  $('#sessions-wrapper').fadeIn();
});

document.querySelector("#dl-button").addEventListener("click", () => {
  if (currentMessages) {
    // console.log("sending current messages as json");
    // https://stackoverflow.com/a/30800715
    dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentMessages));
    let dlA = document.createElement("a");
    dlA.setAttribute("href", dataStr);
    dlA.setAttribute("download", currentSession.replace(/:/g, '-') + '.json');
    document.body.appendChild(dlA);
    dlA.click();
    dlA.remove();
  } else {
    console.log("no current messages");
  }
});

document.querySelector("#info-button").addEventListener("click", () => {
  $('.message-info').fadeToggle("slow");
});
