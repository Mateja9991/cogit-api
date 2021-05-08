const { User, Session, Message } = require('../db/models');
const { optionsBuilder } = require('./utils/services.utils');

async function createPrivateSessionHandler(req, res, next) {
	try {
		const session = getSessionHandler([
			req.user._id.toString(),
			req.params.userId,
		]);
		res.send(session);
	} catch (e) {
		next(e);
	}
}

async function getUsersPrivateSessions(req, res, next) {
	try {
		const sessions = await Session.find({
			participants: { $elemMatch: { userId: req.user._id } },
			teamId: { $exists: false },
		}).lean();
		res.send(sessions);
	} catch (e) {
		next(e);
	}
}

async function getOnePrivateSession(req, res, next) {
	try {
		const session = await getPrivateSessionHandler([
			req.user._id,
			req.params.userId,
		]);
		res.send(session);
	} catch (e) {
		next(e);
	}
}

async function teamSessionHandler(req, res, next) {
	try {
		const session = await Session.findOne({
			teamId: req.params.teamId,
		}).lean();
		res.send(session);
	} catch (e) {
		next(e);
	}
}

async function getMessagesHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			'createdAt',
			1
		);
		const sessionMessages = await Message.find(
			{
				sessionId: req.params.sessionId,
			},
			'from text createdAt -_id',
			options
		);
		res.send(sessionMessages);
	} catch (e) {
		next(e);
	}
}

async function getSessionHandler(sessionParticipants, teamId) {
	try {
		let session;
		if (teamId) {
			session = await getTeamSessionHandler(teamId);
			if (session) {
				await session.updateParticipants();
			}
		} else {
			session = await getPrivateSessionHandler(sessionParticipants);
		}
		return session
			? session
			: await newSessionHandler(sessionParticipants, teamId);
	} catch (e) {
		next(e);
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
			}).lean();
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
		next(e);
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
		).lean();
		return sessionMessages;
	} catch (e) {
		next(e);
	}
}

async function getTeamSessionHandler(teamId) {
	const session = await Session.findOne({
		teamId,
	});
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

async function addParticipantHandler(teamId, userId) {
	try {
		const session = await Session.findOne({ teamId });
		session.participants.forEach((par) => {
			if (par.userId.equals(userId)) {
				res.status(500);
				throw new Error('already member');
			}
		});
		session.participants.push({
			userId,
		});
		await session.save();
		return true;
	} catch (e) {
		next(e);
	}
}
module.exports = {
	addParticipantHandler,
	newSessionHandler,
	getTeamSessionHandler,
	getSessionMessagesHandler,
	getSessionHandler,
	getPrivateSessionHandler,
	createPrivateSessionHandler,
	getUsersPrivateSessions,
	teamSessionHandler,
	getMessagesHandler,
	getOnePrivateSession,
};
