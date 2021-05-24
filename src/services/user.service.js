const bcrypt = require('bcryptjs');

const Socket = require('../socket/socket');
const { SOCKET_EVENTS } = require('../constants/socket_events');
const { User, Project, Task, Avatar, Calendar, Team } = require('../db/models');
const mongoose = require('mongoose');
const timeValues = require('../constants/time_values');
const { deleteSingleTeamHandler } = require('./team.service');

const {
	sendResetTokenMail,
	optionsBuilder,
	matchBuilder,
	queryHandler,
	scheduleJobHandler,
	destructureObject,
	newNotification,
} = require('./utils');

const {
	getSessionMessagesHandler,
	getSessionHandler,
	addParticipantHandler,
} = require('./session.service');

const { MODEL_PROPERTIES } = require('../constants');
const { jwtAuthMiddleware } = require('../middleware/auth');

const selectFields = MODEL_PROPERTIES.USER.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.USER.ALLOWED_KEYS;

//
//        ROUTER HANDLERS
//
async function createUserHandler(req, res, next) {
	{
		try {
			const userObject = destructureObject(req.body, allowedKeys.CREATE);
			const user = new User({
				...userObject,
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
		if (!user.active) {
			user.active = true;
			await user.save();
		}
		const token = await user.generateAuthToken();
		user.updateContacts(
			Socket.sendEventToRoom.bind(Socket),
			SOCKET_EVENTS.CONTACTS_UPDATED
		);

		res.send({ user, token, notificationNumber });
	} catch (e) {
		next(e);
	}
}

async function setAvatarHandler(req, res, next) {
	try {
		const avatar = await Avatar.findById(req.params.avatarId);
		if (!avatar) {
			res.status(404);
			throw new Error('Avatar not found.');
		}
		req.user.avatar = req.params.avatarId;
		await req.user.save();
		// req.user.avatar.picture = await req.user.generateBase64();
		res.send(avatar);
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
	await req.user.populate('teams').execPopulate();
	await req.user.populate('avatar').execPopulate();
	// if (req.user.avatar) {
	// 	req.user.avatar.picture = await req.user.generateBase64();
	// }
	res.send(req.user);
}

async function getAvatarHandler(req, res, next) {
	try {
		if (!req.user.avatar) {
			res.status(404);
			throw new Error('User has no avatar.');
		}
		await req.user.populate('avatar').execPopulate();

		res.send(req.user.avatar.picture);
	} catch (e) {
		next(e);
	}
}

async function getUserHandler(req, res, next) {
	try {
		const user = await User.findById(req.params.userId).lean();
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
		const requestedNotifications = queryHandler(
			req.user.notifications,
			req.query,
			undefined,
			'receivedAt',
			1
		);

		res.send(requestedNotifications);

		await markAsRead(req.user, requestedNotifications);
	} catch (e) {
		console.log(e);
		next(e);
	}
}
async function markAsRead(user, requestedNotifications) {
	try {
		user.notifications.forEach((notif) => {
			if (requestedNotifications.includes(notif) && !notif.seen)
				notif.seen = true;
		});
		await user.save();
	} catch (e) {
		console.log(e);
		console.log('notif mark as read failed.');
	}
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
		const contact = await User.findById(req.params.userId).lean();
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			'createdAt',
			1
		);
		await req.user.populate('avatar', 'username _id avatar').execPopulate();
		await contact.populate('avatar').execPopulate();
		const messages = await getSessionMessagesHandler(options, [
			req.user._id,
			contact._id,
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
		for (const msg of messages) {
			await msg.populate('from', 'username _id avatar').execPopulate();
			await msg.from.populate('avatar').execPopulate();
		}
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
		res.status(404);
		throw new Error('User not found.');
	}
	return user;
}

//
//
//

async function updateUserHandler(req, res, next) {
	try {
		const updates = Object.keys(req.body);
		if (updates.includes('password')) {
			if (updates.includes('oldPassword')) {
				await req.user.checkPassword(req.body.oldPassword);
				console.log(123);
				updates.splice(
					updates.findIndex((update) => update === 'oldPassword'),
					1
				);
			} else {
				throw new Error('Old Password Not Found.');
			}
		}
		console.log(updates);
		const isValidUpdate = updates.every((update) =>
			allowedKeys.UPDATE.includes(update)
		);
		if (!isValidUpdate) {
			res.status(422);
			throw new Error('Invalid update fields.');
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
			res.status(404);
			throw new Error('User not found.');
		}
		if (
			user.invitations
				.map((invitation) => invitation.teamId)
				.includes(req.team._id) ||
			user.teams.includes(req.team._id)
		) {
			res.status(400);
			throw new Error('Already invited or joined.');
		}

		user.invitations.push({ teamId: req.team._id, receivedAt: Date.now() });
		await newNotification(user, {
			event: {
				text: `${req.user.username} invited you to join his team '${req.team.name}'.`,
				reference: req.team,
			},
		});

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
		) {
			res.status(400);
			throw new Error('You have not been invited.');
		}
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
		await newNotification(team.leaderId, {
			event: {
				text: `User ${req.user.username} has accepted your invitation.`,
				reference: team,
			},
		});

		const projects = await Project.find({ teamId: team._id });
		for (const project of projects) {
			await scheduleJobHandler(
				project.deadline,
				req.user._id,
				Socket,
				Project,
				project._id
			);
		}

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

async function leaveTeamHandler(req, res, next) {
	try {
		console.log(req.team.leaderId);
		console.log(req.user._id);
		if (req.team.leaderId.equals(req.user._id)) {
			res.status(406);
			throw new Error('You are Team leader.');
		}
		req.user.teams = req.user.teams.filter(
			(team) => !team.equals(req.team._id)
		);
		await req.user.save();
		await req.user.populate('teams').execPopulate();
		res.send(req.user.teams);
	} catch (e) {
		next(e);
	}
}

async function updateSettingsHandler(req, res, next) {
	try {
		const updates = Object.keys(req.body);
		const isValidUpdate = updates.every((update) =>
			allowedKeys.SETTINGS.includes(update)
		);
		if (!isValidUpdate) {
			res.status(422);
			throw new Error('Invalid update fields.');
		}
		updates.forEach((update) => {
			console.log(update.toString(), update.toString() === 'projectView');
			if (update.toString() === 'projectView') {
				console.log(req.user.settings.projectView);
				const index = req.user.settings.projectView.findIndex((prView) =>
					prView.reference.equals(req.body[update].reference)
				);
				if (index !== -1) {
					req.user.settings.projectView[index] = req.body[update];
				} else {
					req.user.settings.projectView.push(req.body[update]);
				}
			} else {
				req.user.settings[update] = req.body[update];
			}
		});
		await req.user.save();
		res.send(req.user.settings);
	} catch (e) {
		next(e);
	}
}

async function sendResetTokenHandler(req, res, next) {
	try {
		const user = await User.findOne({ email: req.params.email });
		if (!user) {
			res.status(404);
			throw new Error('User not found.');
		}
		const key = generateKey(6);
		user.resetToken = {
			key,
			expiresIn: new Date(Date.now() + timeValues.hour),
		};
		await user.save();
		sendResetTokenMail('zlatanovic007@gmail.com', key);
		res.send(user);
	} catch (e) {
		next(e);
	}
}
function generateKey(len) {
	let key = '';
	for (let i = 0; i < len; i++) key += Math.floor(Math.random() * 10);
	return key;
}
async function changePasswordHandler(req, res, next) {
	try {
		const user = await User.findOne({ email: req.params.email });
		if (!user) {
			res.status(404);
			throw new Error('User not found.');
		}
		const rtKey = user.resetToken.key;
		if (
			user.resetToken &&
			(user.resetToken.expiresIn.getTime() < Date.now() ||
				!(await bcrypt.compare(req.params.key, rtKey)))
		) {
			throw new Error('Invalid reset token');
		}
		user.resetToken.expiresIn = new Date(Date.now());
		await user.save();
		console.log(user.resetToken);
		const token = await user.generateAuthToken();
		await user.updateContacts(
			Socket.sendEventToRoom.bind(Socket),
			SOCKET_EVENTS.CONTACTS_UPDATED
		);

		res.send({ user, token });
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
		const users = await User.find({ ...match }, '', options).lean();
		res.send(users);
	} catch (e) {
		next(e);
	}
}

async function deleteAnyUserHandler(req, res, next) {
	try {
		if (!req.admin) {
			res.status(403);
			throw new Error('You are not admin.');
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

async function testNotif(req, res, next) {
	try {
		newNotification(req.user, {
			event: {
				text: `TEst.`,
				reference: req.user,
			},
		});
		res.send({ success: true });
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
	sendResetTokenHandler,
	changePasswordHandler,
	leaveTeamHandler,
	testNotif,
};
