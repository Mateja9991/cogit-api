const Task = require('../db/models/task.model');
const User = require('../db/models/user.model');
const Comment = require('../db/models/comment.model');
const { deleteSingleCommentHandler } = require('./comment.service');

async function createTaskHandler(req, res) {
	await createTask(res, req, {
		...req.body,
		listId: req.list._id,
	});
}

async function createSubTaskHandler(req, res) {
	try {
		const parentTask = await Task.findOne({ _id: req.params.taskId });
		await createTask(res, req, {
			...req.body,
			listId: parentTask.listId,
			parentTaskId: parentTask._id,
			editors: parentTask.editors,
			isArchived: parentTask.isArchived,
			isTeamPriority: parentTask.isTeamPriority,
			usersPriority: parentTask.usersPriority,
		});
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function createTask(res, req, task) {
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
		res.send(newTask);
	} catch (e) {
		res.status(400).send({ error: e.message });
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
			editors: req.user._id,
		})
			.limit(parseInt(req.query.limit))
			.skip(req.query.skip)
			.sort(sort);
		res.send(usersTask);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getSpecificTaskHandler(req, res) {
	try {
		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTeamPriorityTasksHandler(req, res) {
	try {
		const priorityTasks = await Task.find({
			editors: req.user._id,
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
			editors: req.user._id,
			usersPriority: req.user._id,
		});
		res.send(priorityTasks);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTasksFromListHandler(req, res) {
	try {
		const match = {
			isArchived: req.query.isArchived ? req.query.isArchived : false,
			isTeamPriority: req.query.isTeamPriority
				? req.query.isTeamPriority
				: false,
			isCompleted: req.query.isCompleted ? req.query.isCompleted : false,
		};
		const tasks = await Task.find({
			listId: req.list._id,
			...match,
		});
		console.log(tasks);
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
		req.task.isTeamPriority = req.body.isTeamPriority === true;
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
async function assignUserHandler(req, res) {
	try {
		req.task.editors.push(req.assignee._id);
		await req.task.save();

		res.send(req.task);
	} catch (e) {
		console.log(e);
		res.status(400).send({ error: e.message });
	}
}

async function archiveTaskHandler(req, res) {
	try {
		req.task.isArchived = req.body.isArchived === true;
		await req.task.save();

		res.send(req.task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteTaskHandler(req, res) {
	try {
		await deleteSingleTaskHandler(req.task);
		return res.json({ message: 'Successfully deleted' });
	} catch (e) {
		console.log(e);
		return res.status(400).json({ error: e.message });
	}
}

async function deleteSingleTaskHandler(task) {
	let stack = [];
	stack.push(task);
	const promises = [];
	while (stack.length > 0) {
		let currentTask = stack.pop();
		await currentTask.populate('subTasks').execPopulate();
		for (const sub of currentTask.subTasks) {
			stack.push(sub);
		}
		const commentsToRemove = await Comment.find({
			taskId: currentTask._id,
		});
		if (commentsToRemove.length > 0) {
			for (const comment of commentsToRemove) {
				primises.push(comment.remove());
			}
		}
		promises.push(currentTask.remove());
	}
	await Promise.all(promises);
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
};
