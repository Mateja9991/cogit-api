const jwt = require('jsonwebtoken');
const { User } = require('../../db/models');

const jwtAuthMiddleware = async (req, res, next) => {
	try {
		const token = req.header('Authorization').replace('Bearer ', '');
		const { _id } = jwt.verify(token, process.env.TOKEN_KEY);
		const user = await User.findById(_id);
		if (!user) {
			res.status(404);
			throw new Error('User not found');
		}
		if (user.role === 'admin') {
			req.admin = user;
		}
		req.user = user;

		req.token = token;
		next();
	} catch (e) {
		next(e);
	}
};

module.exports = {
	jwtAuthMiddleware,
};
