const express = require('express');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	projectToLeaderAuth,
	teamMemberAuth,
	projectToMemberAuth,
} = require('../middleware/auth');
const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');
const Project = require('../db/models/project.model');
const List = require('../db/models/list.model');

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

router.get('/projects/me/', jwtAuthMiddleware, getMyProjectsHandler);

router.get(
	'/projects/:projectId',
	jwtAuthMiddleware,
	projectToMemberAuth,
	getSpecificProjectHandler
);

//NAKNADNO

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
