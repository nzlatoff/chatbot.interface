const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const url = process.env.MONGO_URI;

const connect = mongoose.connect(url, {
	useUnifiedTopology: true,
});

module.exports = connect;
