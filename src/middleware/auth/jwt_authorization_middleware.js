const jwt = require('jsonwebtoken');
const User = require('../../db/models/user.model');

//  Autentifikacija usera (JEL PRIJAVLJEN)
const jwtAuthMiddleware = async (req, res, next) => {
	try {
		const token = req.header('Authorization').replace('Bearer ', '');
		const { _id } = jwt.verify(token, process.env.TOKEN_KEY);
		const user = await User.findOne({ _id });
		if (!user) {
			throw new Error();
		}
		if (req.user.role === 'admin') {
			req.admin = user;
		}
		req.user = user;

		req.token = token;
		next();
	} catch (e) {
		console.log(e);
		res.status(401).send({
			error: 'Please Authenticate.',
		});
	}
};

module.exports = {
	jwtAuthMiddleware,
};
