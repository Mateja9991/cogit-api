const express = require('express');

const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	taskToLeaderAuth,
	teamLeaderAuth,
} = require('../middleware/auth/index');

const {
	createUserHandler,
	loginUserHandler,
	logoutUserHandler,
	getProfileHandler,
	getUserHandler,
	updateUserHandler,
	deleteUserHandler,
	sendTeamInvitationHandler,
	getTeamInvitationsHandler,
	acceptTeamInvitationHandler,
	declineTeamInvitationHandler,
} = require('../services/user.service');

const router = new express.Router();
//
//        ROUTES
//
router.post('/users', createUserHandler);

router.post('/users/login', loginUserHandler);

router.post('/users/logout', jwtAuthMiddleware, logoutUserHandler);

router.get('/users/all', async (req, res) => {
	try {
		const users = await User.find({});
		res.send(users);
	} catch (e) {
		res.status(400).send(users);
	}
});

router.get('/users/me', jwtAuthMiddleware, getProfileHandler);

router.get('/users/:id', jwtAuthMiddleware, getUserHandler);

router.get(
	'/users/me/invitations',
	jwtAuthMiddleware,
	getTeamInvitationsHandler
);

router.patch('/users/me', jwtAuthMiddleware, updateUserHandler);

router.patch(
	'/users/invitations/send/:userId/:teamId',
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
//
//
//
module.exports = router;
