function isTokenValid(entry) {
	if (!entry) {
		return false;
	}
	if (!entry.startedAt) {
		return false;
	}
	const startedAt = new Date(entry.startedAt);
	if (isNaN(startedAt)) {
		console.log("Bad started at");
		return false;
	}

	const lifetimeMs = entry.lifetime_min * 60 * 1000; // minutes → ms
	const expireAt = startedAt.getTime() + lifetimeMs;

	return Date.now() < expireAt;
}

module.exports = { isTokenValid };
