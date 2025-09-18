function isTokenValid(entry) {
	if (!entry) {
		return false;
	}
	if (!entry.startedAt) {
		return false;
	}
	const lifetimeMs = entry.lifetimeMin * 60 * 1000; // minutes → ms
	const expireAt = entry.startedAt.getTime() + lifetimeMs;
	return Date.now() < expireAt;
}

module.exports = { isTokenValid };
