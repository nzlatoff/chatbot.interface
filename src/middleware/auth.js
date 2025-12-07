// --- Middleware d’auth ---
const { isTokenValid } = require("../utils/tokens");
const connectdb = require("../dbconnect");
const Token = require("../models/Token");

async function requireAuth(req, res, next) {
	if (req.session.user) return next();

	const token = req.query.token || req.headers["x-access-token"];
	if (token) {
		await connectdb;
		const entry = await Token.findOne({ token: token });
		if (entry) {
			if (!entry.startedAt) {
				await Token.updateOne(
					{ token: token }, // filter
					{ $set: { startedAt: new Date() } }, // update
				);
				entry.startedAt = new Date();
			}
			if (isTokenValid(entry)) {
				return next();
			}
		}
	}
	console.log(req.originalUrl);
	if (req.originalUrl === "/check-token") {
		return res.status(403).send("Auth KO");
	} else {
		return res.status(302).redirect("/signin");
	}
}

function requireAdmin(req, res, next) {
	if (req.session.user && req.session.user === "admin") return next();
	res.redirect("/signin");
}

module.exports = { requireAuth, requireAdmin };
