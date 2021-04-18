const Session = require('../db/models/session.model');
const Message = require('../db/models/message.model');

async function getSessionHandler(sessionParticipants, teamId) {
	try {
		let session;
		if (teamId) {
			session = getTeamSessionHandler(teamId);
		} else {
			session = getPrivateSessionHandler(sessionParticipants);
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
			teamId: teamId,
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
		console.log(sessionMessages);
		return sessionMessages;
	} catch (e) {
		console.log(e);
	}
}

async function getTeamSessionHandler(teamId) {
	const session = await Session.findOne({
		teamId,
	});
	if (!session) {
		throw new Error('No such team session.');
	}
	return session;
}

async function getPrivateSessionHandler(sessionParticipants) {
	let result = null;
	console.log(sessionParticipants);
	const sessions = await Session.find({
		participants: { $elemMatch: { userId: { $in: sessionParticipants } } },
	});
	console.log('proslo');
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
	console.log('result:	', result);
	if (!result) {
		throw new Error('No such private session.');
	}
	return result;
}

module.exports = {
	getSessionHandler,
	newSessionHandler,
	getSessionMessagesHandler,
};
