const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// return the list of connected users from the app shared variable
router.route('/').get((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  const clientsocketlist = res.app.locals.clientsocketlist;
  //console.log(clientsocketlist);
  res.json(clientsocketlist);
});

module.exports = router;
