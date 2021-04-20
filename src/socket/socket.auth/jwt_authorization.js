const jwt = require('jsonwebtoken');
const User = require('../../db/models/user.model');

const jwtSocketAuth = async (token) => {
	try {
		if (!token) {
			throw new Error('No Authorization');
		}
		const { _id } = jwt.verify(token, process.env.TOKEN_KEY);
		const user = await User.findById(_id);

		if (!user) {
			throw new Error('Not Authorized');
		}
		return user;
	} catch (e) {
		return e;
	}
};

module.exports = {
	jwtSocketAuth,
};
