const express = require('express');
const {
	jwtAuthMiddleware,
	projectToLeaderAuth,
	projectToMemberAuth,
	listToLeaderAuth,
	listToMemberAuth,
} = require('../middleware/auth');

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
	'/lists/projects/:projectId',
	jwtAuthMiddleware,
	projectToLeaderAuth,
	createListHandler
);

router.get(
	'/lists/projects/:projectId',
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
