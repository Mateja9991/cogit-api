const express = require('express');
const upload = require('multer')({
	liimits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, callback) {
		if (file.originalname.match(/\.(jpeg|jpg|png)$/)) {
			callback(undefined, true);
		} else {
			callback(new Error('Please upload image (png, jpg,)'));
		}
	},
});

const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
} = require('../middleware/auth/index');
const { errorHandler } = require('./utils/router.utils');
const {
	createUserHandler,
	loginUserHandler,
	logoutUserHandler,
	getProfileHandler,
	getUserHandler,
	getUserByEmailHandler,
	getAllUsersHandler,
	updateUserHandler,
	deleteUserHandler,
	sendTeamInvitationHandler,
	getTeamInvitationsHandler,
	acceptTeamInvitationHandler,
	declineTeamInvitationHandler,
	deleteAnyUserHandler,
	getUserMessagesHandler,
	getTeamMessagesHandler,
	getAllNotificationsHandler,
	getUserByUsernameHandler,
	uploadAvatarHandler,
	getAvatarHandler,
	deleteAvatarHandler,
} = require('../services/user.service');

const router = new express.Router();
//
//        ROUTES
//
router.post('/users', createUserHandler);

router.post('/users/login', loginUserHandler);

router.post('/users/logout', jwtAuthMiddleware, logoutUserHandler);

router.post(
	'/users/me/avatar',
	jwtAuthMiddleware,
	upload.single('avatar'),
	uploadAvatarHandler
);

router.get('/users/all', jwtAuthMiddleware, getAllUsersHandler);

router.get('/users/me', jwtAuthMiddleware, getProfileHandler);

router.get('/users/me/avatar', jwtAuthMiddleware, getAvatarHandler);

router.get('/users/:id', jwtAuthMiddleware, getUserHandler);

router.get(
	'/users/me/invitations',
	jwtAuthMiddleware,
	getTeamInvitationsHandler
);

router.get(
	'/users/me/notifications',
	jwtAuthMiddleware,
	getAllNotificationsHandler
);

router.get(
	'/users/:userId/me/messages',
	jwtAuthMiddleware,
	getUserMessagesHandler
);

router.get(
	'/users/me/teams/:teamId/messages',
	jwtAuthMiddleware,
	getTeamMessagesHandler
);

router.get('/users/email/:email', jwtAuthMiddleware, getUserByEmailHandler);

router.get(
	'/users/username/:username',
	jwtAuthMiddleware,
	getUserByUsernameHandler
);

router.patch('/users/me', jwtAuthMiddleware, updateUserHandler);

router.patch(
	'/users/:userId/teams/:teamId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Team,
		'params.teamId',
		'team',
		'leaderId',
		'user._id'
	),
	sendTeamInvitationHandler
);

router.patch(
	'/users/me/invitations/accept/:teamId',
	jwtAuthMiddleware,
	acceptTeamInvitationHandler
);

router.patch(
	'/users/me/invitations/decline/:teamId',
	jwtAuthMiddleware,
	declineTeamInvitationHandler
);

router.delete('/users/me', jwtAuthMiddleware, deleteUserHandler);

router.delete('/users/me/avatar', jwtAuthMiddleware, deleteAvatarHandler);

router.delete('/users/:userId', jwtAuthMiddleware, deleteAnyUserHandler);
//
//
//
module.exports = router;
