//require the express module
const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
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

//setup event listener
socketio.on("connection", socket => {

  socket.on("get list", function() {
    socket.emit("users list", app.locals.clientsocketlist);
    socket.broadcast.emit("get typing");
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
    // console.log('New user logged on server:', clientInfo.user);
    app.locals.clientsocketnumber++;
    // console.log('now', app.locals.clientsocketnumber, 'clients');

    if (app.locals.clientsocketnumber == 1) {
      // creating a new session
      currentSession = new Date().toISOString();
      console.log('one user, creating new session:', currentSession);
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
          socket.emit('scroll down');
        }else {
          // console.log('nothing found');
        }
      });
    }

  });

  socket.on("disconnect", function() {

    // console.log('disconnecting', socket.user, socket.id);
    delete app.locals.clientsocketlist[socket.id];
    // console.log('User left server:', clientInfo.user);
    app.locals.clientsocketnumber--;
    // console.log('now', app.locals.clientsocketnumber, 'clients');

    socket.broadcast.emit("user left", {
      id: socket.id,
      user: socket.user
    });
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      id: data.id,
      user: data.user,
      message: data.message,
      character: data.character
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

  socket.on("reset session", function() {
    // console.log("resetting session");
    // console.log("current session:", currentSession);
    currentSession = new Date().toISOString();
    console.log("new session:", currentSession);
    socket.broadcast.emit("erase messages");
    for (cl in app.locals.clientsocketlist) {
      socket.broadcast.emit("new user", app.locals.clientsocketlist[cl]);
    }
  });

});

http.listen(process.env.PORT || port, () => {
  console.log("Running on Port: ", port);
});

