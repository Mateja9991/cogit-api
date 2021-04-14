const SocketService = require('../socket/socket');
const User = require('../db/models/user.model');
const Team = require('../db/models/team.model');
const { deleteSingleTeamHandler } = require('./team.service');
//message
async function sendMessageToSession(sessionId, userId) {
	const session = await Session.findById(sessionId);
	const message = 'Hello';
	session.participants.forEach((participantId) => {
		if (participantId !== userId) {
			sendMessageEvent(participantId, message);
		}
	});
}

function sendMessageEvent(room, message) {
	SocketService.sendEventToRoom(room, 'new-message', message);
}

//
//        ROUTER HANDLERS
//

async function createUserHandler(req, res) {
	{
		try {
			if (req.body.role) {
				delete req.body.role;
			}
			const user = new User(req.body);
			await user.save();
			const token = await user.generateAuthToken();
			res.send({ user, token });
		} catch (e) {
			res.status(400).send(e);
		}
	}
}

async function loginUserHandler(req, res) {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
}

async function logoutUserHandler(req, res) {
	try {
		req.user.tokens = req.user.tokens.filter(
			(token) => token.token !== req.token
		);
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
}
//  GET YOUR PROFILE
async function getProfileHandler(req, res) {
	req.user.populate('teams');
	res.send(req.user);
}

async function getUserHandler(req, res) {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			updateTeamHandler;
			return res.status(404).send();
		}
		res.send(user);
	} catch (e) {
		res.status(500).send();
	}
}

async function getTeamInvitationsHandler(req, res) {
	try {
		console.log(req.user.invitations);

		await req.user.populate('invitations').execPopulate();
		res.send(req.user.invitations);
	} catch (e) {
		res.status(400).send();
	}
}

async function updateUserHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name', 'email', 'password', 'age'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	if (!isValidUpdate) {
		return res.status(404).send();
	}

	try {
		updates.forEach((update) => {
			req.user[update] = req.body[update];
		});
		await req.user.save();
		res.send(req.user);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function sendTeamInvitationHandler(req, res, next) {
	try {
		const user = await User.findOne({ _id: req.params.userId });
		if (!user) {
			throw new Error('User not found.');
		}
		if (
			user.invitations.length &&
			user.invitations.includes(req.team._id) &&
			user.teams.includes(req.team._id)
		) {
			throw new Error();
		}

		if (user.invitations.length < 20) {
			console.log(req.team);
			console.log(user.invitations);
			user.invitations.push(req.team._id);
			await user.save();
			res.send({ num: user.invitations.length });
		}
	} catch (e) {
		console.log(e);
		res.status(400).send({ error: e.message });
	}
}

async function acceptTeamInvitationHandler(req, res) {
	try {
		req.user.invitations = req.user.invitations.filter((invitationId) => {
			if (invitationId.equals(req.params.teamId)) {
				req.user.teams.push(req.params.teamId);

				return false;
			}
			return true;
		});
		await req.user.save();
		res.send(req.user.teams);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function declineTeamInvitationHandler(req, res) {
	try {
		req.user.invitations = req.user.invitations.filter(
			(invitationId) => !invitationId.equals(req.params.teamId)
		);
		await req.user.save();
		res.send(req.user.invitations);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteUserHandler(req, res) {
	try {
		if (req.user.teams.length) {
			req.user.teams.forEach((team) => {
				if (team.leaderId.equals(req.user._id)) {
					deleteSingleTeamHandler(team);
				}
			});
		}
		await req.user.remove();
		res.send(req.user);
	} catch (e) {
		res.status(500).send({ error: e.message });
	}
}
//
//				ADMIN ROUTES
//

async function getAllUsersHandler() {
	try {
		if (!req.admin) {
			throw new Error('You are not admin');
		}
		const users = await User.find({});
		res.send(users);
	} catch (e) {
		res.status(500).send({ error: e.message });
	}
}

async function deleteAnyUserHandler(req, res) {
	try {
		if (!req.admin) {
			throw new Error('You are not admin');
		}
		const user = User.findById(req.params.userId);
		if (user.teams.length) {
			user.teams.forEach((team) => {
				if (team.leaderId.equals(user._id)) {
					deleteSingleTeamHandler(team);
				}
			});
		}
		await user.remove();
		res.send(user);
	} catch (e) {
		res.status(500).send({ error: e.message });
	}
}

module.exports = {
	createUserHandler,
	loginUserHandler,
	logoutUserHandler,
	getProfileHandler,
	getUserHandler,
	getAllUsersHandler,
	updateUserHandler,
	deleteUserHandler,
	sendTeamInvitationHandler,
	getTeamInvitationsHandler,
	acceptTeamInvitationHandler,
	declineTeamInvitationHandler,
	deleteAnyUserHandler,
};
