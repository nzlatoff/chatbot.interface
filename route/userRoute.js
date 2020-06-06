const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();

// return the list of connected users from the app shared variable
router.route("/").get((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  console.log(res.app.locals.clientsocketlist);
  res.json(res.app.locals.clientsocketlist);
});

module.exports = router;
