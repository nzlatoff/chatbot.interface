const express = require("express");
const tokenUtils = require("../utils/tokens");
const { v4: uuid4 } = require("uuid");
const fs = require("node:fs");
const path = require("node:path");
const { requireAdmin } = require("../middleware/auth");
const Token = require("../models/Token");
const connect = require("../dbconnect");

const router = express.Router();

// return the list of connected users from the app shared variable
router.route("/").get(requireAdmin, async (req, res, next) => {
	const BASE_URL = process.env.SERVER_HOST;
	await connect;
	const tokens = await Token.find();
	let html = fs.readFileSync(
		path.join(__dirname, "views", "tokens.html"),
		"utf-8",
	);
	const options = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "Europe/Paris", // specify the timezone you want
	};

	const formatter = new Intl.DateTimeFormat("fr-FR", options);
	// Replace placeholders
	html = html.replace(
		"{{main}}",
		`
    <h1>Tokens</h1>
    <ul>${tokens
			.map((entry) => {
				const diffMs = entry.startedAt ? new Date() - entry.startedAt : null; // difference in milliseconds
				const diffMinutes = diffMs ? Math.floor(diffMs / (1000 * 60)) : null;
				const minAgo =
					diffMinutes !== null
						? `Depuis <strong>${diffMinutes}</strong> minute${diffMinutes > 1 ? "s" : ""}.`
						: "";
				return `<li>${entry.token} <form method="post" style="display: inline-block" action="/tokens/delete?token=${entry.token}"><button class="button">Delete</button></form>
						<ul>
							<li>Crée : ${formatter.format(entry.createdAt)} pour une durée de <strong>${entry.lifetimeMin || "?"}</strong> min.</li>
							<li>Début: ${entry.startedAt ? formatter.format(entry.startedAt) : "pas commencé"}. ${minAgo}</li>
							<li>Lien : <a href="${BASE_URL}/auth?token=${entry.token}">${BASE_URL}/auth?token=${entry.token}</a>
						</ul>
					</li>`;
			})
			.join("")}</ul>
  `,
	);

	res.send(html);
});

router.route("/new").post(requireAdmin, async (req, res, next) => {
	const new_token = uuid4();
	const { lifetime } = req.body;
	await connect;
	await Token.create({
		createdAt: new Date(),
		startedAt: null,
		lifetimeMin: lifetime || 30,
		token: new_token,
		name: "guest",
	});
	res.redirect("/tokens");
});

router.route("/delete").post(requireAdmin, async (req, res, next) => {
	const token = req.query.token;
	if (token) {
		await Token.deleteOne({ token: token });
	}
	res.redirect("/tokens");
});

router.route("/test").get(requireAdmin, (req, res, next) => {
	res.send("Ceci est une page protégée 🎉");
});

module.exports = router;
