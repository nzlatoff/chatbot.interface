const express = require('express');
const connectdb = require('./../dbconnect');
const Chats = require('./../models/Chat');

const router = express.Router();

router.route('/').get((req, res, next) => {
  console.log('retrieving messages for current session:', req.app.locals.currentSession );

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;

  connectdb.then(db => {
    Chats.find({ session: req.app.locals.currentSession }).then((chat, err) => {
      if (err) throw `an error occurred retrieving current session messages: ${err}`;
      res.json(chat);
    });
  });

});

module.exports = router;
