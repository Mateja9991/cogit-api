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
} = require('./utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.TASK.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.TASK.ALLOWED_KEYS;

async function createTaskHandler(req, res, next) {
	if (new Date(req.body.deadline).getTime < Date.now()) {
		res.status(422);
		throw new Error('Invalid date.');
	}
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
		if (new Date(req.body.deadline).getTime < Date.now()) {
			res.status(422);
			throw new Error('Invalid date.');
		}
		if (new Date(req.body.deadline) > parentTask.deadline) {
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
		const newTask = new Task({ ...task });
		newTask.creatorId = req.user._id;
		if (
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
		}
		res.send(usersTasks);
	} catch (e) {
		next(e);
	}
}

async function getSpecificTaskHandler(req, res, next) {
	try {
		await req.task.populate('subTasks').execPopulate();
		await req.task.populate('comments').execPopulate();
		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function getTeamPriorityTasksHandler(req, res, next) {
	try {
		const priorityTasks = await getTasksHandler(
			req,
			{ editors: req.user._id, isTeamPriority: true },
			selectFields
		);
		for (const task of priorityTasks) {
			await task.populate('subTasks').execPopulate();
		}
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
		for (const task of priorityTasks) {
			await task.populate('subTasks').execPopulate();
		}
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
		for (const task of tasks) {
			await task.populate('subTasks').execPopulate();
		}
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

	return tasks;
}

async function updateTaskHandler(req, res, next) {
	const updates = Object.keys(req.body);
	const isValidUpdate = updates.every((update) =>
		allowedKeys.UPDATE.includes(update)
	);

	try {
		if (!isValidUpdate) {
			res.status(422);
			throw new Error('Invalid update fields');
		}
		updates.forEach((update) => {
			req.task[update] = req.body[update];
		});
		await req.task.save();
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
				reference: task,
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
		return res.json(await deleteSingleTaskHandler(req.task));
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
