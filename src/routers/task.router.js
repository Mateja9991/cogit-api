const express = require('express');

const { Task } = require('../db/models');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	listToLeaderAuth,
	listToMemberAuth,
	taskToLeaderAuth,
	taskToMemberAuth,
	teamMemberAuth,
	assignAuth,
} = require('../middleware/auth');

const router = new express.Router();
const {
	createTaskHandler,
	createSubTaskHandler,
	getUserTasksHandler,
	getSpecificTaskHandler,
	getUserPriorityTasksHandler,
	updateTaskHandler,
	deleteTaskHandler,
	assignUserHandler,
	archiveTaskHandler,
	setUsersPriorityHandler,
	setTeamsPriorityHandler,
	changeListHandler,
	getTasksFromListHandler,
} = require('../services/task.service');
//
//				ROUTES
//
router.post(
	'/tasks/lists/:listId',
	jwtAuthMiddleware,
	listToLeaderAuth,
	createTaskHandler
);

router.post(
	'/tasks/:taskId/sub',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(Task, 'params.taskId', 'task', 'editors', 'user._id'),
	createSubTaskHandler
);

router.get(
	'/tasks/me/all/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	getUserTasksHandler
);

router.get(
	'/tasks/me/priority',
	jwtAuthMiddleware,
	getUserPriorityTasksHandler
);

router.get(
	'/tasks/:taskId',
	jwtAuthMiddleware,
	taskToMemberAuth,
	getSpecificTaskHandler
);

router.get(
	'/tasks/lists/:listId',
	jwtAuthMiddleware,
	listToMemberAuth,
	getTasksFromListHandler
);

router.patch(
	'/tasks/:taskId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'creatorId',
		'user._id'
	),
	updateTaskHandler
);

router.patch(
	'/tasks/:taskId/lists/:listId',
	jwtAuthMiddleware,
	listToMemberAuth,
	taskToLeaderAuth,
	ownershipAuthMiddleware(Task, 'params.taskId', 'task', 'editors', 'user._id'),
	changeListHandler
);
router.patch(
	'/tasks/:taskId/team-priority',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	setTeamsPriorityHandler
);

router.patch(
	'/tasks/:taskId/me/priority',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(Task, 'params.taskId', 'task', 'editors', 'user._id'),
	setUsersPriorityHandler
);

router.patch(
	'/tasks/:taskId/users/:userId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	assignAuth,
	assignUserHandler
);

router.delete(
	'/tasks/:taskId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'creatorId',
		'user._id'
	),
	deleteTaskHandler
);

module.exports = router;
