const Project = require('../db/models/project.model');
const { deleteSingleListHandler } = require('./list.service');
const {
	duplicateHandler,
	optionsBuilder,
	queryHandler,
	matchBuilder,
} = require('./utils/services.utils');
//
//				ROUTER HANDLERS
//
async function createProjectHandler(req, res) {
	try {
		await duplicateHandler(Project, 'teamId', req.team._id, req.body);
		const project = new Project({
			...req.body,
			teamId: req.team._id,
		});
		await project.save();
		res.send(project);
	} catch (e) {
		console.log(e);
		res.status(400).send({ error: e.message });
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
		res.status(400).send({ error: e.message });
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
		res.status(400).send({ error: e.message });
	}
}

async function getProjectsFromOneTeam(team, options) {
	const teamProjects = await Project.find(
		{
			teamId: team._id,
		},
		'name -_id',
		options
	);

	return teamProjects;
}

async function getSpecificProjectHandler(req, res) {
	res.send(req.project);
}

async function updateProjectHandler(req, res) {
	console.log(123);
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			throw new Error('Invalid update fields.');
		}
		await duplicateHandler(Project, 'teamId', req.project.teamId, req.body);
		updates.forEach((update) => {
			req.project[update] = req.body[update];
		});
		await req.project.save();
		res.send(req.project);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteProjectHandler(req, res) {
	try {
		await deleteSingleProjectHandler(req.project);
		res.send({
			success: true,
		});
	} catch (e) {
		res.status(400).send({ error: e.message });
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
	deleteProjectHandler,
	deleteSingleProjectHandler,
};
