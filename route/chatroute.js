const express = require("express");
const bodyParser = require("body-parser");
const connectdb = require("./../dbconnect");
const Chats = require("./../models/Chat");

const router = express.Router();

router.route("/").get((req, res, next) => {
  var datefrom = (req.query.datefrom) ? new Date(req.query.datefrom): new Date(2000,01,01); // new datefrom parameter to get all the messages from the date
  //console.log("test filter:"+datefrom.toISOString());

  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  connectdb.then(db => {
    let data = Chats.find({ message: "Anonymous" });
    Chats.find({createdAt: { $gte: datefrom.toISOString()} }).then(chat => {
      res.json(chat);
    });
  });
});

module.exports = router;
