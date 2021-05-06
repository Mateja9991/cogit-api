const Socket = require('../socket/socket');
const { SOCKET_EVENTS } = require('../constants/socket_events');
const { User, Avatar, Calendar, Team } = require('../db/models');

const { deleteSingleTeamHandler } = require('./team.service');

const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
} = require('./utils/services.utils');

const {
	getSessionMessagesHandler,
	getSessionHandler,
	addParticipantHandler,
} = require('./session.service');

//
//        ROUTER HANDLERS
//
async function createUserHandler(req, res, next) {
	{
		try {
			if (req.body.role) {
				delete req.body.role;
			}
			if (req.body.tag) {
				delete req.body.tag;
			}
			const user = new User({
				...req.body,
			});
			const userCalendar = new Calendar({
				userId: user._id,
			});
			await user.save();
			await userCalendar.save();
			const token = await user.generateAuthToken();
			res.send({ user, token });
		} catch (e) {
			next(e);
		}
	}
}

async function loginUserHandler(req, res, next) {
	try {
		const user = await User.findByCredentials(req.body.id, req.body.password);
		const notificationNumber = user.notifications.reduce(
			(acc, notif) => acc + (notif.seen ? 0 : 1),
			0
		);
		const token = await user.generateAuthToken();
		res.send({ user, token, notificationNumber });
	} catch (e) {
		next(e);
	}
}

async function setAvatarHandler(req, res, next) {
	try {
		const avatar = await Avatar.findById(req.params.avatarId);
		if (!avatar) throw new Error('No such avatar');
		req.user.avatar = req.params.avatarId;
		await req.user.save();
		res.set('Content-Type', 'image/png');
		res.send(avatar.picture);
	} catch (e) {
		next(e);
	}
}

async function logoutUserHandler(req, res, next) {
	try {
		await req.user.save();
		res.send();
	} catch (e) {
		next(e);
	}
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////									GET ROUTES								////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getProfileHandler(req, res, next) {
	req.user.populate('teams');
	res.send(req.user);
}

async function getAvatarHandler(req, res, next) {
	try {
		await req.user.populate('avatar').execPopulate();
		if (!req.user.avatar) throw new Error('User has no avatar.');
		res.set('Content-Type', 'image/png');
		res.send(req.user.avatar.picture);
	} catch (e) {
		next(e);
	}
}

async function getUserHandler(req, res, next) {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).send();
		}
		res.send(user);
	} catch (e) {
		next(e);
	}
}

async function getAllNotificationsHandler(req, res, next) {
	try {
		const sortBy = req.query.sortBy;
		const requestedNotifications = queryHandler(
			req.user.notifications,
			req.query
		);

		//// ZASTO?!

		let i = 0;
		let subArray;
		let result = [];
		console.log(requestedNotifications[i]);
		while (i < requestedNotifications.length) {
			subArray = requestedNotifications.filter((notif) =>
				sortBy ? notif[sortBy] === requestedNotifications[i][sortBy] : true
			);
			subArray.sort((a, b) => {
				return a.receivedAt.getTime() < b.receivedAt.getTime() ? 1 : -1;
			});
			i += subArray.length;
			result = result.concat(subArray);
		}
		res.send(result);

		await markAsRead(req.user, requestedNotifications);
	} catch (e) {
		console.log(e);
		next(e);
	}
}
async function markAsRead(user, requestedNotifications) {
	user.notifications.forEach((notif) => {
		if (requestedNotifications.includes(notif) && !notif.seen)
			notif.seen = true;
	});
	await user.save();
}
async function getTeamInvitationsHandler(req, res, next) {
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

async function getUserMessagesHandler(req, res, next) {
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

async function getTeamMessagesHandler(req, res, next) {
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

async function getUserByEmailHandler(req, res, next) {
	try {
		const user = await getSingleUserHandler({ email: req.params.email });
		res.send({ user });
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getUserByUsernameHandler(req, res, next) {
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

async function updateUserHandler(req, res, next) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['username', 'email', 'password', 'settings'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			return res.status(404).send();
		}
		updates.forEach((update) => {
			req.user[update] = req.body[update];
		});
		await req.user.save();
		res.send(req.user);
	} catch (e) {
		next(e);
	}
}

async function sendTeamInvitationHandler(req, res, next) {
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
				reference: req.team._id,
				eventType: 'invitation',
			},
			receivedAt: Date.now(),
		};
		user.notifications.push(newEvent);

		await user.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function acceptTeamInvitationHandler(req, res, next) {
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
				reference: team._id,
				eventType: 'invitation_accepted',
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

async function declineTeamInvitationHandler(req, res, next) {
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

async function updateSettingsHandler(req, res, next) {
	try {
		res.send(req.user.settings);
	} catch (e) {
		next(e);
	}
}

async function deleteUserHandler(req, res, next) {
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

async function getAllUsersHandler(req, res, next) {
	try {
		// if (!req.admin) {
		// 	throw new Error('You are not admin');
		// }
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		const users = await User.find({ ...match }, '', options);
		res.send(users);
	} catch (e) {
		next(e);
	}
}

async function deleteAnyUserHandler(req, res, next) {
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
	setAvatarHandler,
	getAvatarHandler,
	updateSettingsHandler,
};
