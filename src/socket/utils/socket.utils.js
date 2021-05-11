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
	if (ackIndex !== -1) acksMissed.splice(pingedIndex, 1);
}

async function clearNotResponsiveUsers(sendEvent) {
	for (const pingedUserId of pingedUsers) {
		let ackIndex = acksMissed.findIndex((el) => el.userId.equals(pingedUserId));
		let onlineIndex = onlineUsers.findIndex((el) => el.equals(pingedUserId));
		if (onlineIndex === -1) {
			onlineUsers.push(pingedUserId);
			offlineUsers = offlineUsers.filter(
				(userId) => !userId.equals(pingedUserId)
			);
			const onlineUser = await User.findById(pingedUserId);
			onlineUser.active = true;
			await onlineUser.save();
			await onlineUser.updateContacts(
				sendEvent,
				SOCKET_EVENTS.USER_DISCONNECTED,
				'connected'
			);
		}
		if (ackIndex !== -1) {
			if (acksMissed[ackIndex].count > 3) {
				offlineUsers.push(pingedUserId);
				onlineUsers = onlineUsers.filter(
					(userId) => !userId.equals(pingedUserId)
				);
				acksMissed.splice(ackIndex, 1);
				const offlineUser = await User.findById(pingedUserId);
				offlineUser.active = false;
				await offlineUser.save();
				await offlineUser.updateContacts(
					sendEvent,
					SOCKET_EVENTS.USER_DISCONNECTED,
					'disconnected'
				);
			} else {
				acksMissed[ackIndex].count++;
				console.log(
					acksMissed[ackIndex].userId,
					'   ',
					acksMissed[ackIndex].count
				);
			}
		} else {
			acksMissed.push({ userId: pingedUserId, count: 1 });
		}
	}
	pingedUsers = [];
}

module.exports = {
	pingUser,
	clearNotResponsiveUsers,
	connectionAlive,
};
