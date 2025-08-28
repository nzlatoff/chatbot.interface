// --- Middleware d’auth ---
const { loadTokens, isTokenValid } = require("../utils/tokens");

function requireAuth(req, res, next) {
	if (req.session.user) return next();

	const token = req.query.token || req.headers["x-access-token"];
	if (token) {
		const tokens = loadTokens();
		const entry = tokens[token];
		if (entry && isTokenValid(tokens, token, entry)) {
			return next();
		}
	}
	res.redirect("/signin");
}

function requireAdmin(req, res, next) {
	if (req.session.user && req.session.user === "admin") return next();
	res.redirect("/signin");
}

module.exports = { requireAuth, requireAdmin };
