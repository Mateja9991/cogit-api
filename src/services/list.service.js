const List = require('../db/models/list.model');
const Task = require('../db/models/task.model');
const { duplicateHandler } = require('./utils/utils');
const { deleteSingleTaskHandler } = require('./task.service');
//
//				ROUTER HANDLERS
//
async function createListHandler(req, res) {
	try {
		await duplicateHandler(List, 'projectId', req.project._id, req.body);
		const list = new List({
			...req.body,
			projectId: req.project._id,
		});
		await list.save();
		res.send(list);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getProjectsListsHandler(req, res) {
	try {
		await req.project.populate('lists').execPopulate();
		res.send(req.project.lists);
	} catch (e) {
		res.status(400).send({
			error: e.message,
		});
	}
}

async function getSpecificListHandler(req, res) {
	res.send(req.list);
}

async function updateListHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			throw new Error('Invalid update fields.');
		}
		await duplicateHandler(List, 'projectId', req.list.projectId, req.body);

		updates.forEach((update) => {
			req.list[update] = req.body[update];
		});
		await req.list.save();
		res.send(req.list);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteListHandler(req, res) {
	try {
		await deleteSingleListHandler(req.list);
		res.send({
			success: true,
		});
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}
async function deleteSingleListHandler(list) {
	const tasksToDelete = await Task.find({
		listId: list._id,
	});
	for (const task of tasksToDelete) {
		await deleteSingleTaskHandler(task);
	}
	await list.remove();
}

module.exports = {
	createListHandler,
	getProjectsListsHandler,
	getSpecificListHandler,
	updateListHandler,
	deleteListHandler,
	deleteSingleListHandler,
};
