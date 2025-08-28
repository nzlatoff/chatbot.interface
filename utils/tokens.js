const fs = require("fs");

const TOKENS_FILE = "./tokens.json";

function isTokenValid(tokens, token, entry) {
	if (!entry || !entry.lifetime_min) {
		console.log("No entry");
		return false;
	}
	if (!entry.startedAt) {
		entry.startedAt = new Date();
		tokens[token] = entry;
		saveTokens(tokens);
	}
	const startedAt = new Date(entry.startedAt);
	if (isNaN(startedAt)) {
		console.log("Bad strated at");
		return false;
	}

	const lifetimeMs = entry.lifetime_min * 60 * 1000; // minutes → ms
	const expireAt = startedAt.getTime() + lifetimeMs;

	return Date.now() < expireAt;
}

function loadTokens() {
	if (!fs.existsSync(TOKENS_FILE)) return {};
	return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
}
function saveTokens(tokens) {
	fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

module.exports = { loadTokens, saveTokens, isTokenValid };
