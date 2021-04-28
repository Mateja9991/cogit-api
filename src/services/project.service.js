const Project = require('../db/models/project.model');
const { deleteSingleListHandler } = require('./list.service');
const {
	optionsBuilder,
	queryHandler,
	matchBuilder,
} = require('./utils/services.utils');
//
//				ROUTER HANDLERS
//
selectFieldsGlobal_View = 'name tags isArchived isTemplate teamId ';

async function createProjectHandler(req, res) {
	try {
		const project = new Project({
			...req.body,
			teamId: req.team._id,
		});
		await project.save();
		res.send(project);
	} catch (e) {
		next(e);
	}
}

async function getTeamsProjectsHandler(req, res) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const requestedProjects = await getProjectsFromOneTeam(req.team, options);
		res.send(requestedProjects);
	} catch (e) {
		next(e);
	}
}

async function getMyProjectsHandler(req, res) {
	try {
		await req.user.populate('teams').execPopulate();
		if (!req.user.teams.length) {
			throw new Error('User Has No Teams');
		}
		let allProjects = [];
		for (const team of req.user.teams) {
			const teamProjects = await getProjectsFromOneTeam(team);
			teamProjects.forEach((project) => {
				allProjects.push(project);
			});
		}
		const requestedProjects = queryHandler(allProjects, req.query);
		res.send(requestedProjects);
	} catch (e) {
		next(e);
	}
}

async function getProjectsFromOneTeam(team, options) {
	const teamProjects = await Project.find(
		{
			teamId: team._id,
		},
		selectFieldsGlobal_View,
		options
	);

	return teamProjects;
}

async function getSpecificProjectHandler(req, res) {
	res.send(req.project);
}

async function updateProjectHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = [
		'name',
		'description',
		'deadline',
		'isArchived',
		'isTemplate',
		'taggs',
	];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			throw new Error('Invalid update fields.');
		}
		updates.forEach((update) => {
			req.project[update] = req.body[update];
		});
		await req.project.save();
		res.send(req.project);
	} catch (e) {
		next(e);
	}
}
async function addLinkToProjectHandler(req, res) {
	const updates = Object.keys(req.body);

	try {
		if (!updates.includes('link')) throw new Error('Invalid update fields.');
		const url = new URL(updates.link);
		if (url.protocol !== 'http:' && url.protocol !== 'https:')
			throw new Error('Invalid protocol');
		req.project.links.push(updates.link);
		await req.project.save();
		res.send(req.project);
	} catch (e) {
		next(e);
	}
}

async function deleteProjectHandler(req, res) {
	try {
		await deleteSingleProjectHandler(req.project);
		res.send({
			success: true,
		});
	} catch (e) {
		next(e);
	}
}
async function deleteSingleProjectHandler(project) {
	await project.populate('lists').execPopulate();
	for (const list of project.lists) {
		await deleteSingleListHandler(list);
	}
	await project.remove();
}

module.exports = {
	createProjectHandler,
	getTeamsProjectsHandler,
	getMyProjectsHandler,
	getSpecificProjectHandler,
	updateProjectHandler,
	addLinkToProjectHandler,
	deleteProjectHandler,
	deleteSingleProjectHandler,
};
