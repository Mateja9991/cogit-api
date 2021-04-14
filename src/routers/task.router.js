const express = require('express');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	listToLeaderAuth,
	listToMemberAuth,
	taskToLeaderAuth,
	taskToMemberAuth,
	teamMemberAuth,
} = require('../middleware/auth');
const Task = require('../db/models/task.model');
const Team = require('../db/models/team.model');
const router = new express.Router();
const {
	createTaskHandler,
	createSubTaskHandler,
	getUserTasksHandler,
	getSpecificTaskHandler,
	getTeamPriorityTasksHandler,
	getUserPriorityTasksHandler,
	updateTaskHandler,
	deleteTaskHandler,
	assingUserHandler,
} = require('../services/task.service');
//
//				ROUTES
//
router.post(
	'/tasks/:listId',
	jwtAuthMiddleware,
	listToLeaderAuth,
	createTaskHandler
);

router.post(
	'/tasks/sub/:taskId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'editors',
		'user._id',
		true
	),
	createSubTaskHandler
);

router.get('/tasks/me', jwtAuthMiddleware, getUserTasksHandler);

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
	'/tasks/team/priority/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	getTeamPriorityTasksHandler
);

router.patch(
	'/tasks/:taskId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'editors',
		'user._id',
		true
	),
	updateTaskHandler
);

router.patch(
	'/tasks/assign/:taskId/:userId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	assingUserHandler
);

router.patch(
	'/tasks/archive/:taskId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	assingUserHandler
);

router.delete(
	'/tasks/:taskId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	deleteTaskHandler
);

module.exports = router;
