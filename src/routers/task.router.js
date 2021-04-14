const express = require('express');

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
	'/tasks/list/:listId',
	jwtAuthMiddleware,
	listToMemberAuth,
	getTasksFromListHandler
);

// router.get(
// 	'/tasks/team/priority/:teamId',
// 	jwtAuthMiddleware,
// 	teamMemberAuth,
// 	getTeamPriorityTasksHandler
// );

//				UPDATE TASK
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
//				SET USERS PRIORITY
router.patch(
	'/tasks/me/priority/:taskId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'editors',
		'user._id',
		true
	),
	setUsersPriorityHandler
);
//				SET TEAMS PRIORITY
router.patch(
	'/tasks/:taskId/team_priority',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	setTeamsPriorityHandler
);
//				CHANGE LIST
router.patch(
	'/tasks/:taskId/lists/:listId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'editors',
		'user._id',
		true
	),
	changeListHandler
);
//				ASSING USER TO TASK
router.patch(
	'/tasks/:taskId/users/:userId',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	assignAuth,
	assignUserHandler
);
//				ARCHIVE TASK
router.patch(
	'/tasks/:taskId/archive',
	jwtAuthMiddleware,
	taskToLeaderAuth,
	ownershipAuthMiddleware(
		Task,
		'params.taskId',
		'task',
		'creatorId',
		'user._id'
	),
	archiveTaskHandler
);
//				DEL
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
