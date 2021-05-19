const Socket = require('../../socket/socket');
const { SOCKET_EVENTS } = require('../../constants/socket_events');

async function newNotification(user, event) {
	event.receivedAt = Date.now();
	user.notifications.push(event);
	await user.save();
	Socket.sendEventToRoom(
		user._id,
		SOCKET_EVENTS.NEW_NOTIFICATION,
		{
			event,
		},
		'users'
	);
}

async function notifyUsers(users, event) {
	for (const user of users) {
		newNotification(user, event);
	}
}

module.exports = {
	newNotification,
	notifyUsers,
};
