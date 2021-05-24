const { Task, List } = require('../db/models');

const Socket = require('../socket/socket');
const { SOCKET_EVENTS } = require('../constants');

const {
	queryHandler,
	optionsBuilder,
	matchBuilder,
	scheduleJobHandler,
	destructureObject,
	notifyUsers,
	newNotification,
	checkAndUpdate,
} = require('./utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.TASK.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.TASK.ALLOWED_KEYS;

async function createTaskHandler(req, res, next) {
	if (!req.body.deadline) {
		await req.list.populate('projectId').execPopulate();
		req.body.deadline = req.list.projectId.deadline;
	}
	const taskObject = destructureObject(req.body, allowedKeys.CREATE);
	await createTask(
		req,
		res,
		{
			...taskObject,
			listId: req.list._id,
		},
		next
	);
}

async function createSubTaskHandler(req, res, next) {
	try {
		const parentTask = await Task.findOne({ _id: req.params.taskId }).lean();
		const inheritObject = {
			listId: parentTask.listId,
			parentTaskId: parentTask._id,
			editors: parentTask.editors,
			isArchived: parentTask.isArchived,
			isTeamPriority: parentTask.isTeamPriority,
			usersPriority: parentTask.usersPriority,
		};
		const taskObject = destructureObject(req.body, allowedKeys.CREATE);
		if (
			req.body.deadline &&
			new Date(req.body.deadline) > parentTask.deadline
		) {
			req.body.deadline = parentTask.deadline;
		}
		await createTask(
			req,
			res,
			{
				...taskObject,
				...inheritObject,
			},
			next
		);
	} catch (e) {
		next(e);
	}
}

async function createTask(req, res, task, next) {
	try {
		if (task.deadline && new Date(task.deadline).getTime() < Date.now()) {
			res.status(422);
			throw new Error('Invalid date.');
		}
		const newTask = new Task({ ...task });
		newTask.creatorId = req.user._id;
		if (
			newTask.editors &&
			!Array.from(newTask.editors).find((editor) =>
				editor._id.equals(req.user._id)
			)
		) {
			newTask.editors.push(req.user._id);
		}
		await newTask.save();
		scheduleTaskEditorsNotifications(newTask);
		res.send(newTask);
	} catch (e) {
		console.log(e);
		next(e);
	}
}
function scheduleTaskEditorsNotifications(task) {
	task.editors.forEach((editorId) => {
		scheduleJobHandler(task.deadline, editorId, Socket, Task, task._id);
	});
}
async function getUserTasksHandler(req, res, next) {
	try {
		const usersTasks = await getTasksHandler(
			req,
			{ editors: req.user._id },
			selectFields
		);
		for (const task of usersTasks) {
			await task.populate('subTasks').execPopulate();
			attachPriority(task, req.user);
		}
		res.send(usersTasks);
	} catch (e) {
		next(e);
	}
}
function attachPriority(task, user) {
	const taskObject = task.toObject();
	if (task.usersPriority && task.usersPriority.includes(user._id))
		taskObject.isPriority = true;
	else taskObject.isPriority = false;
	return taskObject;
}
async function getSpecificTaskHandler(req, res, next) {
	try {
		await populateTask(task);
		res.send(attachPriority(req.task, req.user));
	} catch (e) {
		next(e);
	}
}
async function populateTask(task) {
	await task.populate('subTasks').execPopulate();
	if (task.editors && task.editors.length) {
		await task
			.populate('editors', MODEL_PROPERTIES.USER.SELECT_FIELDS)
			.execPopulate();
		console.log(task);
		for (const user of task.editors) {
			await user
				.populate('avatar', MODEL_PROPERTIES.AVATAR.SELECT_FIELDS)
				.execPopulate();
		}
	}
	await task
		.populate('comments', MODEL_PROPERTIES.COMMENT.SELECT_FIELDS)
		.execPopulate();
	for (const comment of task.comments) {
		await comment
			.populate('creatorId', MODEL_PROPERTIES.USER.SELECT_FIELDS)
			.execPopulate();
		await comment.creatorId
			.populate('avatar', MODEL_PROPERTIES.AVATAR.SELECT_FIELDS)
			.execPopulate();
	}
}
async function getTeamPriorityTasksHandler(req, res, next) {
	try {
		const priorityTasks = await getTasksHandler(
			req,
			{ editors: req.user._id, isTeamPriority: true },
			selectFields
		);
		res.send(priorityTasks);
	} catch (e) {
		next(e);
	}
}

async function getUserPriorityTasksHandler(req, res, next) {
	try {
		const priorityTasks = await getTasksHandler(
			req,
			{ editors: req.user._id, usersPriority: req.user._id },
			selectFields
		);
		res.send(priorityTasks);
	} catch (e) {
		next(e);
	}
}

async function getTasksFromListHandler(req, res, next) {
	try {
		const tasks = await getTasksHandler(
			req,
			{ listId: req.list._id },
			selectFields
		);

		res.send(tasks);
	} catch (e) {
		next(e);
	}
}

async function getTasksHandler(req, queryFields) {
	const options = optionsBuilder(
		req.query.limit,
		req.query.skip,
		req.query.sortBy,
		req.query.sortValue
	);
	const match = matchBuilder(req.query);

	const tasks = await Task.find(
		{
			...queryFields,
			...match,
		},
		selectFields,
		options
	);
	for (const task of tasks) {
		await populateTask(task);
	}
	return tasks;
}

async function updateTaskHandler(req, res, next) {
	try {
		await checkAndUpdate('TASK', req.task, req.body, res);
		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function setUsersPriorityHandler(req, res, next) {
	try {
		req.task.usersPriority.push(req.user._id);
		await req.task.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function setTeamsPriorityHandler(req, res, next) {
	try {
		if (!req.task) {
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team leader.'
			);
		}
		req.task.isTeamPriority = req.body.isTeamPriority === true;
		await req.task.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function changeListHandler(req, res, next) {
	try {
		await req.task.populate('listId').execPopulate();
		const oldList = req.task.listId;
		req.task.listId = req.params.listId;
		notifyUsers(req.task.editors, {
			event: {
				text: `${req.user.username} has moved task ${req.task.name}. It's moved from list ${oldList.name} to ${req.list.name}.`,
				reference: req.list,
			},
		});
		await req.task.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function assignUserHandler(req, res, next) {
	try {
		if (req.task.editors.includes(req.assignee._id)) {
			res.status(422);
			throw new Error('Already assigned');
		}
		req.task.editors.push(req.assignee._id);
		await newNotification(req.assignee, {
			event: {
				text: `${req.user.username} assigned you to task:'${req.task.name}'.`,
				reference: req.task,
			},
		});

		await req.task.save();

		scheduleJobHandler(
			req.task.deadline,
			req.assignee._id,
			Socket,
			Task,
			req.task._id
		);

		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function deleteTaskHandler(req, res, next) {
	try {
		const list = await List.findById(req.task.listId);
		await deleteSingleTaskHandler(req.task);
		await list.populate('tasks').execPopulate();
		return res.json(list.tasks);
	} catch (e) {
		next(e);
	}
}

async function deleteSingleTaskHandler(currentTask) {
	return currentTask.remove();
}

module.exports = {
	createTaskHandler,
	createSubTaskHandler,
	getUserTasksHandler,
	getSpecificTaskHandler,
	getTeamPriorityTasksHandler,
	getUserPriorityTasksHandler,
	getTasksFromListHandler,
	updateTaskHandler,
	deleteTaskHandler,
	deleteSingleTaskHandler,
	assignUserHandler,
	setUsersPriorityHandler,
	setTeamsPriorityHandler,
	changeListHandler,
	scheduleTaskEditorsNotifications,
};
