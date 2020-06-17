//require the express module
const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
const loginRouter = require("./route/loginRoute");
const userRouter = require('./route/userRoute')

//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");

const port = 5000;

//bodyparser middleware
app.use(bodyParser.urlencoded({ extended: false })) 
app.use(bodyParser.json());

//routes
app.use("/login", loginRouter);
// cookie check to prevent anonymous users
app.get("*", (req,res, next) => {
  // cookie doesn't exist redirect to login
  //console.log('calling..........................................................................................');
  //console.log(req.headers.cookie);
  if(typeof(req.headers.cookie) === 'undefined'){
    res.sendFile(__dirname + "/public/login.html");    
  }else{  
   next(); 
  }
 })

 app.use("/chats", chatRouter);
 app.use("/users", userRouter);

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

//integrating socketio
socket = io(http, { cookie: false });;

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");
app.locals.clientsocketlist = new Array();


//setup event listener
socket.on("connection", socket => {
  //console.log("user connected");

  socket.on("new user", function(usr) {
    // adding user to the app.local shared variable
    var clientInfo = {
      id: socket.id,
      user: usr
    };
    app.locals.clientsocketlist.push(clientInfo);
    console.log('New user logged on server:'+clientInfo.user);  
  });
  
  socket.on("disconnect", function() {
    // removing user from the app.local shared variable
    for( var i=0, len=app.locals.clientsocketlist.length; i<len; ++i ){
      var c = app.locals.clientsocketlist[i];

      if(c.id == socket.id){
        console.log("user "+ c.user +" disconnected");
        app.locals.clientsocketlist.splice(i,1);
          break;  
      } 
     }
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      user: data.user,
      message: data.message
    });
  });

  //when soemone stops typing)
  socket.on("stopTyping", () => {
    socket.broadcast.emit("notifyStopTyping");
  });

   // Anonymous message (original version)
 /* socket.on("chat message", function(msg) {
    console.log("message: " + msg);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", { message: msg });

    //save chat to the database
    connect.then(db => {
      console.log("connected correctly to the server");
      let chatMessage = new Chat({ message: msg, sender: "Anonymous" });

      chatMessage.save();
    });
  });
 */
  
 socket.on("chat message2", function(msg) {
    console.log("message: " + msg.message + ' by ' + msg.sender );

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", { message: msg, sender: msg.sender });

    //save chat to the database
    connect.then(db => {
      console.log("connected correctly to the server");
      let chatMessage = new Chat({ message: msg.message, sender: msg.sender });

      chatMessage.save();
    });
  });
});

http.listen(port, () => {
  console.log("Running on Port: " + port);
});

