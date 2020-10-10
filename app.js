//require the express module
const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatRoute");
const loginRouter = require("./route/loginRoute");
const userRouter = require('./route/userRoute');
const archiveRouter = require('./route/archiveRoute');
const str_obj = require('./cookie2obj.js');

//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");

const port = 5100;

app.locals.currentSession = "";
app.locals.clientsocketlist = {};
app.locals.clientsocketnumber = 0;
app.locals.botsocketlist = {};
app.locals.botsocketnumber = 0;
app.locals.mastersocketlist = [];
app.locals.mastersocketnumber = 0;

//bodyparser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//routes
app.use("/login", loginRouter);

// cookie check to prevent anonymous users
app.get("/", (req, res, next) => {
  // cookie doesn't exist redirect to login
  // console.log(str_obj(req.headers.cookie));
  if(typeof(req.headers.cookie) === 'undefined'){ // no cookies at all
    res.sendFile(__dirname + "/public/login.html");
  } else if (typeof(str_obj(req.headers.cookie).userData) === 'undefined') { // our cookie is missing
    res.sendFile(__dirname + "/public/login.html");
  } else if (str_obj(req.headers.cookie).userData.length == 0) { // our cookie is too small
    res.sendFile(__dirname + "/public/login.html");
  } else{
    next();
  }
})

app.get("/master", (req, res, next) => {
  if (app.locals.mastersocketnumber > 0) {
    res.redirect("/audience");
  } else {
    res.sendFile(__dirname + "/public/master.html");
  }
});

app.get("/bots", (req, res, next) => {
  res.sendFile(__dirname + "/public/bots.html");
});

app.get("/audience", (req, res, next) => {
  res.sendFile(__dirname + "/public/audience.html");
});

app.get("/mechanism", (req, res, next) => {
  res.sendFile(__dirname + "/public/entrails.html");
});

app.get("/optimizer", (req, res, next) => {
  res.sendFile(__dirname + "/public/optimizer.html");
});

app.get("/archive", (req, res, next) => {
  res.sendFile(__dirname + "/public/archive.html");
});

app.use("/chats", chatRouter);
app.use("/users", userRouter);
app.use("/archives", archiveRouter);

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

//integrating socketio
socketio = io(http, { cookie: false });;

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");

//setup event listener
socketio.on("connection", socket => {

  socket.on("get list", function() {
    socket.emit("users list", {...app.locals.clientsocketlist, ...app.locals.botsocketlist});
    socket.broadcast.emit("get typing");
  });

  socket.on("get bot list", function() {
    socket.emit("bots list", app.locals.botsocketlist);
  });

  socket.on("new master", function() {
    app.locals.mastersocketnumber++;
    app.locals.mastersocketlist.push(socket.id);
    console.log('new master logged on server.');
  });

  socket.on("master wants bot config", function() {
    socket.broadcast.emit("get bot config");
  });

  socket.on("new bot", function(user) {
    // adding user to the app.local shared variable
    socket.user = user;
    const clientInfo = {
      id: socket.id,
      user: user,
    };
    socket.broadcast.emit("new user", clientInfo);
    socket.broadcast.emit("new bot", clientInfo);
    // save user in object
    app.locals.botsocketlist[socket.id] = clientInfo;
    app.locals.botsocketnumber++;
    console.log("---------------------------");
    console.log('new bot logged on server:', clientInfo.user, ' | now', app.locals.clientsocketnumber, 'client(s) and ', app.locals.botsocketnumber, 'bot(s).');
  });

  socket.on("config from bot", function(data) {
    console.log("---------------------------");
    console.log(data.user);
    console.log("-----------");
    for (el in data) {
      console.log(`${el}: ${data[el]}`);
    }
    socket.broadcast.emit("bot config from server", data);
  });

  socket.on("new user", function(user) {
    // adding user to the app.local shared variable
    socket.user = user;
    const clientInfo = {
      id: socket.id,
      user: user,
    };
    socket.broadcast.emit("new user", clientInfo);
    // save user in object
    app.locals.clientsocketlist[socket.id] = clientInfo;
    app.locals.clientsocketnumber++;
    console.log('new user logged on server:', clientInfo.user, ' | now', app.locals.clientsocketnumber, 'client(s) and ', app.locals.botsocketnumber, 'bot(s).');

    if (app.locals.clientsocketnumber == 1) {
      // creating a new session
      app.locals.currentSession = new Date().toISOString();
      console.log('=====================================');
      console.log('first user, creating new session:', app.locals.currentSession);
      console.log('=====================================');
      socket.broadcast.emit("erase messages"); // make sure we clean things up
      socket.broadcast.emit("current session", app.locals.currentSession);
    } else if (app.locals.clientsocketnumber > 1) {
        broadcastCurrentSession(socket);
    }

  });

  socket.on("new audience user", function() {
    console.log(`new audience member on server... currently with ${app.locals.clientsocketnumber} client(s) and ${app.locals.botsocketnumber} bot(s).`);
    if (app.locals.clientsocketnumber > 1) {
      broadcastCurrentSession(socket);
    }
  });

  socket.on("master sets bot config", function(data) {
    console.log("---------------------------");
    console.log("master sets bot config:", data);
    socket.broadcast.emit("server sets bot config", data);
  });

  socket.on("master sends choice", function(data) {
    if (data.choice != -1) {
      console.log("---------------------------");
      console.log("master sends message choice:", data);
    }
    socket.broadcast.emit("server sends choice", data);
  });

  socket.on("disconnect", function() {

    // console.log('disconnecting', socket.user, socket.id);

    if (socket.id in app.locals.botsocketlist) {
      delete app.locals.botsocketlist[socket.id];
      app.locals.botsocketnumber--;
      socket.broadcast.emit("bot left", {
        id: socket.id,
        user: socket.user
      });
        console.log("---------------------------");
        console.log('bot left server:', socket.user, ' | now', app.locals.clientsocketnumber, 'client(s) and ', app.locals.botsocketnumber, 'bot(s).');
    }

    if (socket.id in app.locals.clientsocketlist) {
      delete app.locals.clientsocketlist[socket.id];
      app.locals.clientsocketnumber--;
      socket.broadcast.emit("user left", {
        id: socket.id,
        user: socket.user
      });
      console.log("---------------------------");
      console.log('user left server:', socket.user, ' | now', app.locals.clientsocketnumber, 'client(s) and ', app.locals.botsocketnumber, 'bot(s).');
    }

    if (app.locals.mastersocketlist.includes(socket.id)) {
      console.log("master left");
      console.log("---------------------------");
      app.locals.mastersocketnumber--;
      app.locals.mastersocketlist.splice(app.locals.mastersocketlist.indexOf(socket.id), 1);
      console.log('master left server.');
    }

  });

  socket.on("bot confirms choice", data => {
    socket.broadcast.emit("server confirms bot choice", data);
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("server sends typing", {
      id: data.id,
      user: data.user,
      message: data.message,
      character: data.character,
      scroll: data.scroll
    });
  });

  //Someone is sending raw data
  socket.on("entrails", data => {
    // console.log("entrails:", data);
    socket.broadcast.emit("entrails typing", data);
  });

  socket.on("direct chat message", function(data) {
    // console.log("direct message", data);
    socket.broadcast.emit("received direct", data);
  });

  socket.on("chat message", function(data) {
    // console.log("message:", data.message, 'by', data.user);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", data);

    data = { ...data, session: app.locals.currentSession };
    // console.log('about to save message:');
    // console.log(data);

    // save chat to the database
    connect.then(db => {
      // console.log("(saving to db)");
      let chatMessage = new Chat(data);
      chatMessage.save();
    });

  });

  socket.on("chat batch", function(data) {
    if (!app.locals.mastersocketnumber) {
      console.log("---------------------------");
      console.log("no master connected, returning control to bot.");
      socket.emit("server sends choice", { id: data.id, choice: -1 });
    } else {
      socket.broadcast.emit("received batch", data);
    }
  });

  socket.on("new batch", function(data) {
    console.log("master requested new batch", data);
    socket.broadcast.emit("server requests new batch", { id: data.id });
  });

  socket.on("get session", function() {
    socket.emit("current session", app.locals.currentSession);
  });

  socket.on("reset session", function() {
    // console.log("resetting session");
    // console.log("current session:", app.locals.currentSession);
    app.locals.currentSession = new Date().toISOString();
    console.log("new session:", app.locals.currentSession);
    socket.broadcast.emit("erase messages");
    // console.log("users:", app.locals.clientsocketlist);
    for (cl in app.locals.clientsocketlist) {
      socket.broadcast.emit("new user", app.locals.clientsocketlist[cl]);
    }
    // console.log("bots:", app.locals.botsocketlist);
    for (cl in app.locals.botsocketlist) {
      socket.broadcast.emit("new user", app.locals.botsocketlist[cl]);
    }
    socket.broadcast.emit("current session", app.locals.currentSession);
  });

  socket.on("get archives sessions", function() {
    console.log("archives requested");
    Chat.aggregate([{ $group: { _id : "$session", count: { $sum: 1}}}, { $sort: { _id: -1} }], (err, res) => {
      if (err) {
        console.log("error when trying to retrieve sessions", err);
      }
      console.log(`found ${res.length} sessions...`);
      socket.emit("archives sessions", res);
    });
  });

  socket.on("get session messages", function(data) {
    console.log("getting messages for session", data);
    Chat.find({ session: data }).sort({ createdAt: 1 }).exec((err, res) => {
      if (err) {
        console.log("error when trying to retrieve sessions", err);
      }
      console.log(`retrieving ${res.length} messages for session ${data}...`);
      socket.emit("session messages", {
        "session": data,
        "messages": res
      });
    });
  });

});

function broadcastCurrentSession(socket) {

  // finding all messages in session & broadcasting them before the rest
  Chat.find({ session:  app.locals.currentSession }, (err, results) => {
    if (err) console.log('nothing found');
    if (results) {
      // console.log('found:');
      // console.log(JSON.stringify(results, null, 2));
      return results;
    } else {
      // console.log('nothing found');
    }
  }).then((results) => {
    // console.log(results);
    if (results) {
      for (msg of results) {
        // console.log(JSON.stringify(msg, null, 2));
        socket.emit('current session message',
          {
            character: msg.character,
            message: msg.message,
            user: msg.user
          });
      }
    }
  }).then(() => {
    socket.emit('scroll down');
  });
}

http.listen(process.env.PORT || port, () => {
  console.log("Running on Port: ", port);
});

