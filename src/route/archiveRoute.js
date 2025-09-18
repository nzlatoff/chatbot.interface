const express = require("express");
const connectdb = require("./../dbconnect");
const Chats = require("./../models/Chat");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.route("/").get(requireAdmin, (req, res, next) => {
	console.log("retrieving all archived messages:");

	connectdb.then((db) => {
		Chats.find()
			.sort({ createdAt: 1 })
			.then((chat) => {
				res.json(chat);
			});
	});
});

module.exports = router;
