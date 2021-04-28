const express = require('express');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	projectToLeaderAuth,
	teamMemberAuth,
	projectToMemberAuth,
} = require('../middleware/auth');
const Team = require('../db/models/team.model');

const {
	createProjectHandler,
	getTeamsProjectsHandler,
	getMyProjectsHandler,
	getSpecificProjectHandler,
	updateProjectHandler,
	addLinkToProjectHandler,
	deleteProjectHandler,
} = require('../services/project.service');

const router = new express.Router();
//
//        ROUTES
//
router.post(
	'/projects/teams/:teamId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Team,
		'params.teamId',
		'team',
		'leaderId',
		'user._id'
	),
	createProjectHandler
);

router.get(
	'/projects/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	getTeamsProjectsHandler
);

router.get('/projects/me/', jwtAuthMiddleware, getMyProjectsHandler);

router.get(
	'/projects/:projectId',
	jwtAuthMiddleware,
	projectToMemberAuth,
	getSpecificProjectHandler
);

router.patch(
	'/projects/:projectId',
	jwtAuthMiddleware,
	projectToLeaderAuth,
	updateProjectHandler
);

router.patch(
	'/projects/links/:projectId',
	jwtAuthMiddleware,
	projectToMemberAuth,
	addLinkToProjectHandler
);

router.delete(
	'/projects/:projectId',
	jwtAuthMiddleware,
	projectToLeaderAuth,
	deleteProjectHandler
);
//
//
//
module.exports = router;
