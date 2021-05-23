const express = require('express');

const { Team } = require('../db/models');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	teamMemberAuth,
} = require('../middleware/auth/index');
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
	setAvatarHandler,
	getAvatarHandler,
	updateSettingsHandler,
	sendResetTokenHandler,
	changePasswordHandler,
	leaveTeamHandler,
	testNotif,
} = require('../services/user.service');

const router = new express.Router();
//
//        ROUTES
//

router.get('/napravi-notifikaciju', jwtAuthMiddleware, testNotif);
router.post('/users', createUserHandler);

router.post('/users/login', loginUserHandler);

router.post('/users/logout', jwtAuthMiddleware, logoutUserHandler);

router.get('/users/all', jwtAuthMiddleware, getAllUsersHandler);

router.get('/users/me', jwtAuthMiddleware, getProfileHandler);

router.get('/users/me/avatar', jwtAuthMiddleware, getAvatarHandler);

router.get('/users/:userId', jwtAuthMiddleware, getUserHandler);

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
	'/users/me/accept/teams/:teamId',
	jwtAuthMiddleware,
	acceptTeamInvitationHandler
);

router.patch(
	'/users/me/decline/teams/:teamId',
	jwtAuthMiddleware,
	declineTeamInvitationHandler
);

router.patch(
	'/users/me/leave/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	leaveTeamHandler
);

router.patch('/users/me/settings', jwtAuthMiddleware, updateSettingsHandler);

router.patch(
	'/users/me/avatars/:avatarId',
	jwtAuthMiddleware,
	setAvatarHandler
);

router.patch('/users/:email/send-token', sendResetTokenHandler);

router.patch('/users/:email/change-password/:key', changePasswordHandler);

router.delete('/users/me', jwtAuthMiddleware, deleteUserHandler);

router.delete('/users/:userId', jwtAuthMiddleware, deleteAnyUserHandler);
//
//
//
module.exports = router;
