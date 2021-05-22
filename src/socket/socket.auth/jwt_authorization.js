const jwt = require('jsonwebtoken');
const { User } = require('../../db/models');
const { SOCKET_EVENTS } = require('../../constants');
const jwtSocketAuth = async (socketClient, sendEventToRoom) => {
	console.log(socketClient.handshake.auth);
	const { _id } = jwt.verify(
		socketClient.handshake.auth.token,
		process.env.TOKEN_KEY
	);
	const user = await User.findById(_id);
	if (!user) {
		throw new Error('Not Authorized');
	}
	socketClient.user = user;
	socketClient.join(socketClient.user._id.toString(), function () {
		console.log('room joined');
		console.log(socketClient.rooms);
	});
	console.log(socketClient.rooms);
	if (!user.active) {
		user.active = true;
		await user.save();
		user.updateContacts(
			sendEventToRoom,
			SOCKET_EVENTS.USER_DISCONNECTED,
			'from socketjwt'
		);
	}
	return;
};

module.exports = {
	jwtSocketAuth,
};
