const User = require('../db/models/user.model');
const Calendar = require('../db/models/calendar.model');
const { deleteSingleTeamHandler } = require('./team.service');

const {
	getSessionMessagesHandler,
	getSessionHandler,
} = require('../services/session.service');

const Socket = require('../socket/socket');

function sendMessageEvent(room, message) {
	console.log(Socket);
	Socket.sendEventToRoom(room, 'new-message', message);
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
			const userCalendar = new Calendar({
				userId: user._id,
			});
			await user.save();
			await userCalendar.save();
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
		console.log(e);
		res.status(400).send(e);
	}
}

async function logoutUserHandler(req, res) {
	try {
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
		await req.user.populate('invitations').execPopulate();
		res.send(req.user.invitations);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function updateUserHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['username', 'email', 'password'];
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

async function sendTeamInvitationHandler(req, res) {
	try {
		const user = await User.findOne({ _id: req.params.userId });
		if (!user) {
			throw new Error('User not found.');
		}
		if (
			user.invitations.includes(req.team._id) ||
			user.teams.includes(req.team._id)
		) {
			throw new Error('Already invited');
		}

		if (user.invitations.length < 20) {
			user.invitations.push(req.team._id);
			await user.save();
			res.send({ num: user.invitations.length });
		}
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function acceptTeamInvitationHandler(req, res) {
	try {
		console.log(req.user.invitations);
		console.log(req.params.teamId);
		req.user.invitations = req.user.invitations.filter((invitationId) => {
			if (invitationId.equals(req.params.teamId)) {
				req.user.teams.push(req.params.teamId);
				return false;
			}
			return true;
		});
		await req.user.save();
		res.send(req.user.invitations);
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
		console.log(req.user.teams);
		if (req.user.teams.length > 0) {
			await req.user.populate('teams').execPopulate();
			for (const team of req.user.teams) {
				if (team.leaderId.equals(req.user._id)) {
					await deleteSingleTeamHandler(team);
				}
			}
		}
		await req.user.remove();
		res.send(req.user);
	} catch (e) {
		console.log(e.message);
		res.status(500).send({ error: e.message });
	}
}
//
//				ADMIN ROUTES
//

async function getAllUsersHandler(req, res) {
	try {
		// if (!req.admin) {
		// 	throw new Error('You are not admin');
		// }
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

async function getUserMessagesHandler(req, res) {
	try {
		const receiver = await User.findById(req.params.userId);
		const messages = await getSessionMessagesHandler(
			{
				limit: req.query.limit,
				skip: req.query.skip,
			},
			[req.user._id, receiver._id]
		);
		console.log(messages);
		res.send(messages);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTeamMessagesHandler(req, res) {
	try {
		const messages = await getSessionMessagesHandler(
			{
				limit: req.query.limit,
				skip: req.query.skip,
			},
			undefined,
			req.params.teamId
		);
		res.send(messages);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getUserByEmailHandler(req, res) {
	try {
		const user = await User.findOne({ email: req.params.email });
		if (!user) {
			throw new Error('No user with that email found.');
		}
		res.send({ user });
	} catch (e) {
		res.status(400).send({ error: e.message });
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

	getUserByEmailHandler,
	getUserMessagesHandler,
	getTeamMessagesHandler,
};
