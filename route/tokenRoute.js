const express = require("express");
const tokenUtils = require("../utils/tokens");
const RequireAuth = require("../middleware/auth");
const { v4: uuid4 } = require("uuid");
const fs = require("node:fs");
const path = require("node:path");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// return the list of connected users from the app shared variable
router.route("/").get(requireAdmin, (req, res, next) => {
	const tokens = tokenUtils.loadTokens();
	let html = fs.readFileSync(
		path.join(__dirname, "views", "tokens.html"),
		"utf-8",
	);

	// Replace placeholders
	html = html.replace(
		"{{main}}",
		`
    <h1>Tokens</h1>
    <ul>${Object.entries(tokens)
			.map(
				([t, info]) =>
					`<li>${t}
						<ul>
							<li>created: ${info.createdAt || "never"}, started: ${info.startedAt || "never"}, duration: ${info.lifetime_min || "?"} min.</li>
							<li>Lien à partager: <a href="https://chatbot.manufacture-recherche.ch/auth?token=${t}">https://chatbot.manufacture-recherche.ch/auth?token=${t}</a>
							<li><form method="post" action="/tokens/delete?token=${t}"><button class="button">Delete</button></form></li>		
						</ul>
					</li>`,
			)
			.join("")}</ul>
  `,
	);

	res.send(html);
	res.send();
});

router.route("/new").post(requireAdmin, (req, res, next) => {
	const tokens = tokenUtils.loadTokens();
	const new_token = uuid4();
	tokens[new_token] = {
		createdAt: new Date(),
		startedAt: null,
		lifetime_min: 30,
	};
	tokenUtils.saveTokens(tokens);
	res.redirect("/tokens");
});

router.route("/delete").post(requireAdmin, (req, res, next) => {
	const tokens = tokenUtils.loadTokens();
	const token = req.query.token;
	if (token && tokens.hasOwnProperty(token)) {
		delete tokens[token];
	}
	tokenUtils.saveTokens(tokens);
	res.redirect("/tokens");
});

router.route("/test").get(requireAdmin, (req, res, next) => {
	res.send("Ceci est une page protégée 🎉");
});

module.exports = router;
