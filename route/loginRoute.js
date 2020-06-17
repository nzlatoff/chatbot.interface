const express = require("express");
const bodyParser = require("body-parser");
//const connectdb = require("./../dbconnect");
//const User = require("./../models/User");

const router = express.Router();

router.route("/").post((req, res, next) => {

 // console.log("url = ", req.url, "  req-body  = ", req.body,   "res-type  = ", res.get('Content-Type'));
  console.log('detecting user '+req.body.username)
  if (req.body.username.length > 0){ // can't take null username
    res.cookie("userData", req.body.username, {sameSite: 'strict'}); 
  }    
  res.redirect('/')

});


module.exports = router;
