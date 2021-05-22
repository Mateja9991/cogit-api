const { User } = require('../../db/models');
const { SOCKET_EVENTS } = require('../../constants');

let pingedUsers = [],
	acksMissed = [],
	onlineUsers = [],
	offlineUsers = [];

async function pingUser(userId) {
	if (!pingedUsers.find((el) => el.equals(userId))) pingedUsers.push(userId);
}

async function connectionAlive(userId) {
	const pingedIndex = pingedUsers.findIndex((pingedUser) =>
		pingedUser.equals(userId)
	);
	if (pingedIndex !== -1) pingedUsers.splice(pingedIndex, 1);
	const ackIndex = acksMissed.findIndex((ackUser) =>
		ackUser.userId.equals(userId)
	);
	if (ackIndex !== -1) acksMissed[ackIndex].count = 0;
}

async function clearNotResponsiveUsers(sendEvent) {
	for (const pingedUserId of pingedUsers) {
		console.log(pingedUserId);
		let index = acksMissed.findIndex((el) => el.userId.equals(pingedUserId));
		if (index !== -1) {
			if (acksMissed[index].count > 3) {
				offlineUsers.push(pingedUserId);
				acksMissed[index].count = 0;
			} else {
				acksMissed[index].count++;
			}
		} else {
			acksMissed.push({ userId: pingedUserId, count: 1 });
		}
	}
	await updateOfflineUsers(sendEvent);
	pingedUsers = [];
}

async function updateOfflineUsers(sendEvent) {
	for (const offlineUserId of offlineUsers) {
		const offlineUser = await User.findById(offlineUserId);
		offlineUser.active = false;
		await offlineUser.save();
		await offlineUser.updateContacts(
			sendEvent,
			SOCKET_EVENTS.USER_DISCONNECTED,
			'disconnected'
		);
	}
	offlineUsers = [];
}

module.exports = {
	pingUser,
	clearNotResponsiveUsers,
	connectionAlive,
};
