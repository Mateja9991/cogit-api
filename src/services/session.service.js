const Session = require('../db/models/session.model');
const Message = require('../db/models/message.model');
const User = require('../db/models/user.model');

async function getSessionHandler(sessionParticipants, teamId) {
	try {
		let session;
		if (teamId) {
			session = await getTeamSessionHandler(teamId);
		} else {
			session = await getPrivateSessionHandler(sessionParticipants);
		}
		return session
			? session
			: await newSessionHandler(sessionParticipants, teamId);
	} catch (e) {
		console.log(e);
	}
}

async function newSessionHandler(sessionParticipants, teamId) {
	try {
		const newSession = new Session({
			teamId: teamId ? teamId : undefined,
		});
		if (teamId) {
			users = await User.find({
				teams: teamId,
			});
			users.forEach((user) => {
				newSession.participants.push({
					newMessages: 0,
					userId: user._id,
				});
			});
		} else {
			sessionParticipants.forEach((userId) => {
				newSession.participants.push({
					newMessages: 0,
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

async function getSessionMessagesHandler(options, sessionParticipants, teamId) {
	try {
		let session;
		if (teamId) {
			session = await getTeamSessionHandler(teamId);
		} else {
			session = await getPrivateSessionHandler(sessionParticipants);
		}
		const sessionMessages = await Message.find(
			{
				sessionId: session._id,
			},
			'from text createdAt -_id',
			options
		);
		return sessionMessages;
	} catch (e) {
		console.log(e);
	}
}

async function getTeamSessionHandler(teamId) {
	const session = await Session.findOne({
		teamId,
	});
	console.log(teamId);
	console.log(session);
	return session;
}

async function getPrivateSessionHandler(sessionParticipants) {
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
	return result;
}

module.exports = {
	getSessionHandler,
	newSessionHandler,
	getSessionMessagesHandler,
};
