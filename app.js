//require the express module
const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatRoute");
const loginRouter = require("./route/loginRoute");
const userRouter = require('./route/userRoute')
const str_obj = require('./cookie2obj.js');

//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");

const port = 5100;

let currentSession;

//bodyparser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//routes
app.use("/login", loginRouter);

// cookie check to prevent anonymous users
app.get("/", (req,res, next) => {
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

app.get("/master", (req,res, next) => {
  res.sendFile(__dirname + "/public/master.html");
});

app.use("/chats", chatRouter);
app.use("/users", userRouter);

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

//integrating socketio
socketio = io(http, { cookie: false });;

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");
app.locals.clientsocketlist = {};
app.locals.clientsocketnumber = 0;
app.locals.botsocketlist = {};
app.locals.botsocketnumber = 0;

//setup event listener
socketio.on("connection", socket => {

  socket.on("get list", function() {
    socket.emit("users list", {...app.locals.clientsocketlist, ...app.locals.botsocketlist});
    socket.broadcast.emit("get typing");
  });

  socket.on("master wants bot list", function() {
    socket.emit("bots list", app.locals.botsocketlist);
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
      currentSession = new Date().toISOString();
      console.log('=====================================');
      console.log('first user, creating new session:', currentSession);
      console.log('=====================================');
      socket.broadcast.emit("erase messages"); // make sure we clean things up
    } else if (app.locals.clientsocketnumber > 1) {
      // finding all messages in session & broadcasting them before the rest
      Chat.find({ session:  currentSession }, (err, results) => {
        if (err) console.log('nothing found');
        if (results) {
          // console.log('found:');
          // console.log(JSON.stringify(results, null, 2));
          for (msg of results) {
            // console.log(JSON.stringify(msg, null, 2));
            socket.emit('current session message',
              {
                character: msg.character,
                message: msg.message,
                user: msg.user
              });
          }
        }else {
          // console.log('nothing found');
        }
      }).then(() => {
        socket.emit('scroll down');
      });
    }

  });

  socket.on("master sets bot config", function(data) {
    console.log("---------------------------");
    console.log("master sets bot config:", data);
    socket.broadcast.emit("server sets bot config", data);
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

  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      id: data.id,
      user: data.user,
      message: data.message,
      character: data.character,
      scroll: data.scroll
    });
  });

  socket.on("chat message", function(data) {
    // console.log("message:", data.message, 'by', data.user);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", data);

    data = { ...data, session: currentSession };
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
    // console.log("message:", data.message, 'by', data.user);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received batch", data);

  });

  socket.on("reset session", function() {
    // console.log("resetting session");
    // console.log("current session:", currentSession);
    currentSession = new Date().toISOString();
    console.log("new session:", currentSession);
    socket.broadcast.emit("erase messages");
    for (cl in {...app.locals.clientsocketlist, ...app.locals.botsocketlist}) {
      socket.broadcast.emit("new user", app.locals.clientsocketlist[cl]);
    }
  });

});

http.listen(process.env.PORT || port, () => {
  console.log("Running on Port: ", port);
});

