async function adminAuth(req, res, next) {
	try {
		if (!req.admin) {
			throw new Error(
				'Not Authorized. To access this document you need to be admin.'
			);
		}
	} catch (e) {
		next(e);
	}
}

module.exports = {
	adminAuth,
};
