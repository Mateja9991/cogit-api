const express = require('express');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	teamMemberAuth,
} = require('../middleware/auth');
const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');

const {
	createTeamHandler,
	getMemberTeamsHandler,
	getLeaderTeamsHandler,
	getTeamHandler,
	updateTeamHandler,
	deleteTeamHandler,
} = require('../services/team.service');
const {
	ownershipArrayAuthMiddleware,
} = require('../middleware/auth/ownership_auth_middleware');

const router = new express.Router();
//
//        ROUTES
//
router.post('/teams', jwtAuthMiddleware, createTeamHandler);

router.get('/teams/me', jwtAuthMiddleware, getMemberTeamsHandler);

router.get('/teams/me/leader', jwtAuthMiddleware, getLeaderTeamsHandler);

router.get('/teams/:teamId', jwtAuthMiddleware, teamMemberAuth, getTeamHandler);

router.patch(
	'/teams/:teamId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Team,
		'params.teamId',
		'team',
		'leaderId',
		'user._id'
	),
	updateTeamHandler
);

router.delete(
	'/teams/:teamId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Team,
		'params.teamId',
		'team',
		'leaderId',
		'user._id'
	),
	deleteTeamHandler
);
//
//
//
module.exports = router;
