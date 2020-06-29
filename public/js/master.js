const socket = io();

socket.on('connect', function() {
  // console.log('connecting');
  // socket.emit('get list');
  // $('#username').html(`<em>${cookie2obj(document.cookie).userData}:</em>`);
});

$("#reset-button").click(function() {
  console.log("resetting!");
  socket.emit("reset session");
});

