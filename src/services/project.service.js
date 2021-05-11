const { User, Project, Task } = require('../db/models');
const { deleteSingleListHandler } = require('./list.service');
const {
	optionsBuilder,
	queryHandler,
	matchBuilder,
	destructureObject,
} = require('./utils/services.utils');

const { scheduleJobHandler } = require('./utils/services.utils');
const Socket = require('../socket/socket');
//
//				ROUTER HANDLERS
//

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.PROJECT.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.PROJECT.ALLOWED_KEYS;

async function createProjectHandler(req, res, next) {
	try {
		if (new Date(req.body.deadline).getTime() < Date.now()) {
			res.status(422);
			throw new Error('Invalid date.');
		}
		const projectObject = destructureObject(req.body, allowedKeys.CREATE);
		const project = new Project({
			...projectObject,
			teamId: req.team._id,
		});
		await project.save();
		await scheduleTeamMemberNotifications(project);
		res.send(project);
	} catch (e) {
		next(e);
	}
}
async function scheduleTeamMemberNotifications(project) {
	const teamMembers = await User.find({ teams: project.teamId });
	teamMembers.forEach((member) => {
		scheduleJobHandler(
			project.deadline,
			member._id,
			Socket,
			Project,
			project._id
		);
	});
}
async function getTeamsProjectsHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		const requestedProjects = await getProjectsFromOneTeam(
			req.team,
			options,
			match
		);
		res.send(requestedProjects);
	} catch (e) {
		next(e);
	}
}

async function getMyProjectsHandler(req, res, next) {
	try {
		await req.user.populate('teams').execPopulate();
		if (!req.user.teams.length) {
			res.status(404);
			throw new Error('Users team not found.');
		}
		let allProjects = [];
		for (const team of req.user.teams) {
			const teamProjects = await getProjectsFromOneTeam(team);
			teamProjects.forEach((project) => {
				allProjects.push(project);
			});
		}
		const requestedProjects = queryHandler(
			allProjects,
			req.query,
			selectFields
		);
		res.send(requestedProjects);
	} catch (e) {
		next(e);
	}
}

async function getProjectsFromOneTeam(team, options, match) {
	const teamProjects = await Project.find(
		{
			teamId: team._id,
			...match,
		},
		selectFields,
		options
	);

	return teamProjects;
}

async function getSpecificProjectHandler(req, res, next) {
	try {
		await req.project.populate('lists').execPopulate();
		for (const list of req.project.lists) {
			list.tasks = await Task.find({
				listId: list._id,
				parentTaskId: null,
			}).lean();
		}
		const projectView = req.user.settings.projectView.find((projectView) =>
			projectView.reference.equals(req.project._id)
		);
		res.send({
			project: req.project,
			view: projectView ? projectView : req.user.settings.defaultView,
		});
	} catch (e) {
		next(e);
	}
}

async function updateProjectHandler(req, res, next) {
	try {
		const updates = Object.keys(req.body);
		const isValidUpdate = updates.every((update) =>
			allowedKeys.UPDATE.includes(update)
		);
		if (!isValidUpdate) {
			res.status(422);
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

async function addLinkToProjectHandler(req, res, next) {
	const updates = Object.keys(req.body);

	try {
		if (!updates.includes('link')) {
			res.status(400);
			throw new Error('Invalid update fields.');
		}
		const url = new URL(updates.link);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			res.status(422);
			throw new Error('Invalid protocol');
		}
		req.project.links.push(updates.link);
		await req.project.save();
		res.send(req.project);
	} catch (e) {
		next(e);
	}
}

async function deleteProjectHandler(req, res, next) {
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
	scheduleTeamMemberNotifications,
};
