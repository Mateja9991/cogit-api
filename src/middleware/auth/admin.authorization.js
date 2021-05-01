async function adminAuth(req, res, next) {
	try {
		if (!req.admin) {
			throw new Error('Not Authorized. You are not admin.');
		}
	} catch (e) {
		next(e);
	}
}

module.exports = {
	adminAuth,
};
