const { List, Task, Project } = require('../db/models');
const { queryHandler, destructureObject, checkAndUpdate } = require('./utils');
const { deleteSingleTaskHandler } = require('./task.service');
//
//				ROUTER HANDLERS
//
const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.LIST.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.LIST.ALLOWED_KEYS;

async function createListHandler(req, res, next) {
	try {
		const listObject = destructureObject(req.body, allowedKeys.CREATE);
		const list = new List({
			...listObject,
			projectId: req.project._id,
		});
		await list.save();
		res.send(list);
	} catch (e) {
		next(e);
	}
}

async function getProjectsListsHandler(req, res, next) {
	try {
		await req.project.populate('lists').execPopulate();
		for (const list of req.project.lists) {
			list.tasks = await Task.find(
				{
					listId: list._id,
					parentTaskId: null,
				},
				selectFields
			).lean();
		}
		const requestedLists = queryHandler(
			req.project.lists,
			req.query,
			selectFields
		);
		res.send(requestedLists);
	} catch (e) {
		next(e);
	}
}

async function getSpecificListHandler(req, res, next) {
	try {
		req.list.tasks = await Task.find({
			listId: req.list._id,
			parentTaskId: null,
		}).lean();
		res.send(req.list);
	} catch (e) {
		next(e);
	}
}

async function updateListHandler(req, res, next) {
	try {
		await checkAndUpdate('LIST', req.list, req.body, res);
		if (Object.keys(req.body).includes('order')) {
			console.log('order changed.');
			await req.list.changeOrder();
		}
		res.send(req.list);
	} catch (e) {
		next(e);
	}
}

async function deleteListHandler(req, res, next) {
	try {
		const project = await Project.findById(req.list.projectId);
		await req.list.remove();
		await project.populate('lists').execPopulate();
		res.send(project.lists);
	} catch (e) {
		next(e);
	}
}

module.exports = {
	createListHandler,
	getProjectsListsHandler,
	getSpecificListHandler,
	updateListHandler,
	deleteListHandler,
};
