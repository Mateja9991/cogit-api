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

async function updateTaskHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['completed', 'description'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);
	if (!isValidUpdate) {
		return res.status(400).send();
	}
	try {
		const task = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) {
			return res.status(404).send();
		}
		updates.forEach((update) => {
			task[update] = req.body[update];
		});
		await task.save();
		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function assingUserHandler(res, req) {
	try {
		if (!req.task) {
			throw new Error();
		}
		task.editors.push(req.params.userId);
		await task.save();

		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteTaskHandler(req, res) {
	try {
		const task = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
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
	updateTaskHandler,
	deleteTaskHandler,
	assingUserHandler,
};
