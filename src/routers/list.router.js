const express = require('express');
const {
	jwtAuthMiddleware,
	projectToLeaderAuth,
	projectToMemberAuth,
	listToLeaderAuth,
	listToMemberAuth,
} = require('../middleware/auth');
const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');
const Project = require('../db/models/project.model');
const List = require('../db/models/list.model');

const {
	createListHandler,
	getProjectsListsHandler,
	getSpecificListHandler,
	updateListHandler,
	deleteListHandler,
} = require('../services/list.service');

const router = new express.Router();
//
//        ROUTES
//
router.post(
	'/lists/:projectId',
	jwtAuthMiddleware,
	projectToLeaderAuth,
	createListHandler
);

router.get(
	'/lists/project/:projectId',
	jwtAuthMiddleware,
	projectToMemberAuth,
	getProjectsListsHandler
);

router.get(
	'/lists/:listId',
	jwtAuthMiddleware,
	listToMemberAuth,
	getSpecificListHandler
);

router.patch(
	'/lists/:listId',
	jwtAuthMiddleware,
	listToLeaderAuth,
	updateListHandler
);

router.delete(
	'/lists/:listId',
	jwtAuthMiddleware,
	listToLeaderAuth,
	deleteListHandler
);
//
//
//
module.exports = router;
