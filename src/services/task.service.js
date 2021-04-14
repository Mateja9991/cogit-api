const Task = require('../db/models/task.model');
const User = require('../db/models/user.model');

async function createTaskHandler(req, res) {
	await createTask(res, {
		...req.body,
		list: req.list._id,
	});
}

async function createSubTaskHandler(req, res) {
	try {
		const parentTask = await Task.findOne({ _id: req.params.taskId });
		await createTask(res, {
			...req.body,
			list: parentTask.list,
			parentTaskId: parentTask._id,
		});
	} catch (e) {
		res.status(400).send();
	}
}

async function createTask(res, task) {
	try {
		const newTask = new Task({ ...task });
		newTask.creatorId.push(req.user._id);
		newTask.editors.push(req.user._id);
		await newTask.save();
		res.send(newTask);
	} catch (e) {
		res.status(400).send();
	}
}

async function getUserTasksHandler(req, res) {
	const sort = {};
	req.query.sortBy
		? (sort[req.query.sortBy] = req.query.sort ? req.query.sort : 1)
		: (sort.createdAt = req.query.sort ? req.query.sort : 1);
	if (req.query.isCompleted) {
		match.isCompleted = req.query.isCompleted === true;
	}
	try {
		const usersTask = await Task.find({
			editors: { $elemMatch: req.user._id },
		})
			.limit(parseInt(req.query.limit))
			.skip(req.query.skip)
			.sort(sort);
		res.send(usersTask);
	} catch (e) {
		console.log(e);
		res.status(400).send({ error: e.message });
	}
}

async function getSpecificTaskHandler(req, res) {
	try {
		if (!req.task) {
			res.status(404).send();
		}
		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTeamPriorityTasksHandler(req, res) {
	try {
		const priorityTasks = await Task.find({
			editors: { $elemMatch: req.user._id },
			isTeamPriority: true,
		});
		res.send(priorityTasks);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getUserPriorityTasksHandler(req, res) {
	try {
		const priorityTasks = await Task.find({
			editors: { $elemMatch: req.user._id },
			usersPriority: { $elemMatch: req.user._id },
		});
		res.send(priorityTasks);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTasksFromListHandler(req, res) {
	try {
		const tasks = Task.find({
			listId: req.list._id,
			isArchived: req.query.isArchived,
			isTeamPriority: req.query.isTeamPriority,
			isCompleted: req.query.isCompleted,
		});
		res.send(tasks);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function updateTaskHandler(req, res) {
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
		res.status(400).send({ error: e.message });
	}
}
//	user priority set
async function setUsersPriorityHandler(req, res) {
	try {
		req.task.usersPriority.push(req.user._id);
		await req.task.save();
		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}
//	team priority set
async function setTeamsPriorityHandler(req, res) {
	try {
		req.task.isTeamPriority = req.body.isTeamPriority;
		await req.task.save();
		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}
//	change listId (promena liste)
async function changeListHandler(req, res) {
	try {
		req.task.listId = req.params.listId;
		await req.task.save();
		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}
//
async function assignUserHandler(res, req) {
	try {
		req.task.editors.push(req.assignee._id);
		await req.task.save();

		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function archiveTaskHandler(req, res) {
	try {
		req.task.isArchived = req.body.isArchived;
		await task.save();

		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteTaskHandler(req, res) {
	try {
		await req.task.remove();
		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
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
	assignUserHandler,
	setUsersPriorityHandler,
	setTeamsPriorityHandler,
	changeListHandler,
};
