const express = require('express');

const { Team } = require('../db/models');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	projectToLeaderAuth,
	teamMemberAuth,
	projectToMemberAuth,
} = require('../middleware/auth');

const {
	createProjectHandler,
	getTeamsProjectsHandler,
	getMyProjectsHandler,
	getSpecificProjectHandler,
	updateProjectHandler,
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

router.get('/projects/me', jwtAuthMiddleware, getMyProjectsHandler);

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
