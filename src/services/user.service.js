const sharp = require('sharp');
const User = require('../db/models/user.model');
const Calendar = require('../db/models/calendar.model');
const Team = require('../db/models/team.model');
const { deleteSingleTeamHandler } = require('./team.service');
const { addParticipantHandler } = require('./session.service');
const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
} = require('./utils/services.utils');

const {
	getSessionMessagesHandler,
	getSessionHandler,
} = require('../services/session.service');

const Socket = require('../socket/socket');
const { SOCKET_EVENTS } = require('../constants/socket_events');

//'images',
//        ROUTER HANDLERS
//
async function createUserHandler(req, res) {
	{
		try {
			if (req.body.role) {
				delete req.body.role;
			}
			if (req.body.tag) {
				delete req.body.tag;
			}
			const tag = await User.generateTag();
			const user = new User({
				...req.body,
				tag,
			});
			const userCalendar = new Calendar({
				userId: user._id,
			});
			await user.save();
			await userCalendar.save();
			const token = await user.generateAuthToken();
			res.send({ user, token });
		} catch (e) {
			console.log(e);
			res.status(400).send({ error: e.message });
		}
	}
}

async function loginUserHandler(req, res) {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const notificationNumber = user.notifications.reduce(
			(acc, notif) => acc + (notif.seen ? 0 : 1),
			0
		);
		const token = await user.generateAuthToken();
		res.send({ user, token, notificationNumber });
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function uploadAvatarHandler(req, res) {
	try {
		const avatarBuffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = avatarBuffer;
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(400).send({ error: e.message });
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////									GET ROUTES								////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getProfileHandler(req, res) {
	req.user.populate('teams');
	res.send(req.user);
}

async function getAvatarHandler(req, res) {
	try {
		res.set('Content-Type', 'image/png');
		res.send(
			req.user.avatar
				? req.user.avatar
				: await require('../constants/default_avatar')()
		);
	} catch (e) {
		next(e);
	}
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
		next(e);
	}
}

async function getAllNotificationsHandler(req, res) {
	try {
		const requestedNotifications = queryHandler(
			req.user.notifications,
			req.query
		);
		req.user.notifications.forEach((notif) => {
			if (requestedNotifications.includes(notif) && !notif.seen)
				notif.seen = true;
		});
		await req.user.save();
		res.send(requestedNotifications);
	} catch (e) {
		next(e);
	}
}

async function getTeamInvitationsHandler(req, res) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		await req.user
			.populate({
				path: 'invitations',
				match,
				options,
			})
			.execPopulate();
		res.send(req.user.invitations);
	} catch (e) {
		next(e);
	}
}

async function getUserMessagesHandler(req, res) {
	try {
		const receiver = await User.findById(req.params.userId);
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			'createdAt',
			1
		);

		const messages = await getSessionMessagesHandler(options, [
			req.user._id,
			receiver._id,
		]);
		res.send(messages);
	} catch (e) {
		next(e);
	}
}

async function getTeamMessagesHandler(req, res) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			'createdAt',
			-1
		);
		const messages = await getSessionMessagesHandler(
			options,
			undefined,
			req.params.teamId
		);
		res.send(messages);
	} catch (e) {
		next(e);
	}
}

async function getUserByEmailHandler(req, res) {
	try {
		const user = await getSingleUserHandler({ email: req.params.email });
		res.send({ user });
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getUserByUsernameHandler(req, res) {
	try {
		const user = await getSingleUserHandler({ username: req.params.username });
		res.send({ user });
	} catch (e) {
		next(e);
	}
}

async function getSingleUserHandler(queryObject) {
	const user = await User.findOne(queryObject);
	if (!user) {
		throw new Error('No user found.');
	}
	return user;
}

//
//
//

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
		next(e);
	}
}

async function sendTeamInvitationHandler(req, res) {
	try {
		const user = await User.findOne({ _id: req.params.userId });
		if (!user) {
			throw new Error('User not found.');
		}
		if (
			user.invitations
				.map((invitation) => invitation.teamId)
				.includes(req.team._id) ||
			user.teams.includes(req.team._id)
		) {
			throw new Error('Already invited or joined.');
		}

		user.invitations.push({ teamId: req.team._id, receivedAt: Date.now() });

		Socket.sendEventToRoom(
			user._id,
			SOCKET_EVENTS.NEW_NOTIFICATION,
			{
				event: 'You have been invited.',
			},
			'users'
		);

		const newEvent = {
			event: {
				text: 'You have been invited to new team.',
				reference: {
					_id: req.team._id,
					eventType: 'invitation',
				},
			},
			receivedAt: Date.now(),
		};
		user.notifications.push(newEvent);

		await user.save();
		res.send({ num: user.invitations.length });
	} catch (e) {
		next(e);
	}
}

async function acceptTeamInvitationHandler(req, res) {
	try {
		if (
			!req.user.invitations.filter((inv) =>
				inv.teamId.equals(req.params.teamId)
			).length
		)
			throw new Error('You have not been invited.');
		req.user.invitations = req.user.invitations.filter((invitation) => {
			if (invitation.teamId.equals(req.params.teamId)) {
				req.user.teams.push(req.params.teamId);
				return false;
			}
			return true;
		});
		const team = await Team.findById(req.params.teamId);
		await addParticipantHandler(team._id, req.user._id);
		await req.user.save();
		await team.populate('leaderId').execPopulate();
		Socket.sendEventToRoom(
			team.leaderId._id,
			SOCKET_EVENTS.NEW_NOTIFICATION,
			{
				event: 'Invitation accepted.',
			},
			'users'
		);
		const newEvent = {
			event: {
				text: `User ${req.user.username} has accepted your invitation.`,
				reference: {
					_id: team._id,
					eventType: 'invitation_accepted',
				},
			},
			receivedAt: Date.now(),
		};
		team.leaderId.notifications.push(newEvent);
		await team.leaderId.save();
		res.send(req.user.invitations);
	} catch (e) {
		next(e);
	}
}

async function declineTeamInvitationHandler(req, res) {
	try {
		req.user.invitations = req.user.invitations.filter(
			(invitation) => !invitation.teamId.equals(req.params.teamId)
		);
		await req.user.save();
		res.send(req.user.invitations);
	} catch (e) {
		next(e);
	}
}

async function deleteUserHandler(req, res) {
	try {
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
		next(e);
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
		next(e);
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
		next(e);
	}
}
async function deleteAvatarHandler(req, res) {
	try {
		if (req.user.avatar) {
			req.user.avatar = null;
			await req.user.save();
		}
		res.send();
	} catch (e) {
		next(e);
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
	getAllNotificationsHandler,
	getUserByEmailHandler,
	getUserMessagesHandler,
	getTeamMessagesHandler,
	getUserByUsernameHandler,
	uploadAvatarHandler,
	getAvatarHandler,
	deleteAvatarHandler,
};
