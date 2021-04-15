const SocketService = require('../socket/socket');
const Session = require('../db/models/session.model');
const Message = require('../db/models/message.model');
const { SOCKET_EVENTS } = require('../constants/socketl_events');

function sendMessageEvent(room, message, callback) {
	SocketService.sendEventToRoom(
		room,
		SOCKET_EVENTS.NEW_MESSAGE,
		message,
		session
	);
}
async function getNotificationsHandler() {}
async function sendMessageToSession(sessionId, userId, message) {
	try {
		let session = await Session.findById(sessionId);
		if (!session) {
			throw new Error('No session');
		}
		await new Message({
			text: message,
			sessionId: sessionId,
			from: userId,
		}).save();
		session.participants.forEach((participant) => {
			if (!participant.userId.equals(userId)) {
				participant.newMessages = participant.newMessages++;
			}
		});
		session.participants.forEach((participant) => {
			if (!participant.userId.equals(userId)) {
				sendMessageEvent(participant.userId, message, () => {
					session.participants = session.participants.map((participant) => {
						if (participant.userId.equals(userId)) {
							participansessiont.newMessages = 0;
						}
						return participant;
					});
				});
			}
		});
	} catch (e) {
		console.log(e);
	}
}

async function getSessionHandler(sessionParticipants, teamId) {
	if (teamId) {
		const session = await Session.find({
			teamId,
		});
		return session ? session : newSessionHandler(undefined, teamId);
	} else {
		let result = null;
		const sessions = await Session.find({
			participants: { $elemMatch: { userId: { $in: sessionParticipants } } },
		});
		sessions.forEach((session) => {
			session.userIds = session.participants.map(
				(participant) => participant.userId
			);
			if (
				session.userIds.sort().toString() ===
				sessionParticipants.sort().toString()
			) {
				result = session;
			}
		});

		return result ? result : newSessionHandler(sessionParticipants);
	}
}

async function newSessionHandler(sessionParticipants, teamId) {
	try {
		const newSession = new Session({
			teamId: teamId,
		});
		if (teamId) {
			users = await User.find({
				teams: teamId,
			});
			users.forEach((user) => {
				newSession.participants.push({
					userId: user._id,
				});
			});
		} else {
			sessionParticipants.forEach((userId) => {
				newSession.participants.push({
					userId,
				});
			});
		}
		await newSession.save();
		return newSession;
	} catch (e) {
		console.log(e);
	}
}

module.exports = {
	sendMessageEvent,
	sendMessageToSession,
	newSessionHandler,
	getSessionHandler,
	getNotificationsHandler,
};

// const messageSchema = new Schema({
// 	text: {
// 		type: String,
// 		required: true,
// 		maxlength: [250, 'Message too long. (>250)'],
// 	},
// 	sessionId: {
// 		type: Schema.Types.ObjectId,
// 		required: true,
// 		ref: MODEL_NAMES.SESSION,
// 	},
//	seenBy{ ref: 'User'}
// 	from: {
// 		type: Schema.Types.ObjectId,
// 		required: true,
// 		ref: MODEL_NAMES.USER,
// 	},
// 	sentAt: Date,
// 	receivedAt: Date,
// 	seenAt: Date,
// });
