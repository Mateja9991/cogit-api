const express = require('express');

const { Team } = require('../db/models');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	teamMemberAuth,
	adminAuth,
} = require('../middleware/auth');

const {
	createTeamHandler,
	getAllUserTeamsHandler,
	getLeaderTeamsHandler,
	getTeamHandler,
	updateTeamHandler,
	deleteTeamHandler,
	getMembersHandler,
	getAllTeams,
} = require('../services/team.service');

const router = new express.Router();
//
//        ROUTES
//
router.post('/teams', jwtAuthMiddleware, createTeamHandler);

router.get('/teams/all', jwtAuthMiddleware, adminAuth, getAllTeams);

router.get('/teams/me', jwtAuthMiddleware, getAllUserTeamsHandler);

router.get('/teams/me/leader', jwtAuthMiddleware, getLeaderTeamsHandler);

router.get('/teams/:teamId', jwtAuthMiddleware, teamMemberAuth, getTeamHandler);

router.get(
	'/teams/:teamId/members',
	jwtAuthMiddleware,
	teamMemberAuth,
	getMembersHandler
);

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
