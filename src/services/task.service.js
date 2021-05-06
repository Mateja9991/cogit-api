const { Task } = require('../db/models');

const Socket = require('../socket/socket');
const { SOCKET_EVENTS } = require('../constants/socket_events');

const {
	duplicateHandler,
	queryHandler,
	optionsBuilder,
	matchBuilder,
	scheduleJobHandler,
} = require('./utils/services.utils');

const selectFieldsGlobal =
	'name description isCompleted parentTaskId isArchived isTeamPriority';

async function createTaskHandler(req, res, next) {
	if (!req.body.deadline) {
		await req.list.populate('projectId').execPopulate();
		req.body.deadline = req.list.projectId.deadline;
	}
	await createTask(
		res,
		req,
		{
			...req.body,
			listId: req.list._id,
		},
		next
	);
}

async function createSubTaskHandler(req, res, next) {
	try {
		const parentTask = await Task.findOne({ _id: req.params.taskId });
		if (req.body.deadline > parentTask.deadline)
			req.body.deadline = parentTask.deadline;
		await createTask(
			res,
			req,
			{
				...req.body,
				listId: parentTask.listId,
				parentTaskId: parentTask._id,
				editors: parentTask.editors,
				isArchived: parentTask.isArchived,
				isTeamPriority: parentTask.isTeamPriority,
				usersPriority: parentTask.usersPriority,
			},
			next
		);
	} catch (e) {
		next(e);
	}
}

async function createTask(res, req, task, next) {
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
			selectFieldsGlobal
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
			selectFieldsGlobal
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
			selectFieldsGlobal
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
			selectFieldsGlobal
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
		selectFieldsGlobal,
		options
	);

	return tasks;
}

async function updateTaskHandler(req, res, next) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name', 'description', 'isCompleted'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
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
		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function setTeamsPriorityHandler(req, res, next) {
	try {
		if (!req.task) throw new Error('You are not authorized.');
		req.task.isTeamPriority = req.body.isTeamPriority === true;
		await req.task.save();
		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function changeListHandler(req, res, next) {
	try {
		req.task.listId = req.params.listId;
		await req.task.save();
		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function assignUserHandler(req, res, next) {
	try {
		req.task.editors.push(req.assignee._id);

		Socket.sendEventToRoom(
			req.assignee._id,
			SOCKET_EVENTS.NEW_NOTIFICATION,
			{
				assignedTo: req.task,
			},
			'users'
		);
		const newEvent = {
			event: {
				text: 'You have been assigned to new task.',
				reference: req.task._id,
				eventType: 'assignment',
			},
			receivedAt: Date.now(),
		};
		req.assignee.notifications.push(newEvent);
		await req.assignee.save();
		await req.task.save();

		res.send(req.task);
	} catch (e) {
		next(e);
	}
}

async function archiveTaskHandler(req, res, next) {
	try {
		req.task.isArchived = req.body.isArchived === true;
		await req.task.save();

		return res.json(req.task);
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
	archiveTaskHandler,
	deleteTaskHandler,
	deleteSingleTaskHandler,
	assignUserHandler,
	setUsersPriorityHandler,
	setTeamsPriorityHandler,
	changeListHandler,
	scheduleTaskEditorsNotifications,
};
