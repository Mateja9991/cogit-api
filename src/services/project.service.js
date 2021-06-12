const { User, Project, Task, Team, List } = require('../db/models');
const { attachPriority } = require('./task.service');
const {
	optionsBuilder,
	queryHandler,
	matchBuilder,
	destructureObject,
	checkAndUpdate,
} = require('./utils');

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
		if (
			req.body.deadline &&
			new Date(req.body.deadline).getTime() < Date.now()
		) {
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
		req.project.lists = await List.find({ projectId: req.project._id }).lean();
		for (const list of req.project.lists) {
			list.tasks = await Task.find({
				listId: list._id,
				parentTaskId: null,
			});
			let taskObjects = [];
			for (task of list.tasks) {
				taskObjects.push(attachPriority(task, req.user));
			}
			list.tasks = taskObjects;
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
		await checkAndUpdate('PROJECT', req.project, req.body, res);
		res.send(req.project);
	} catch (e) {
		next(e);
	}
}

async function deleteProjectHandler(req, res, next) {
	try {
		const team = await Team.findById(req.project.teamId);
		await req.project.remove();
		await team.populate('projects').execPopulate();
		res.send(team.projects);
	} catch (e) {
		next(e);
	}
}
module.exports = {
	createProjectHandler,
	getTeamsProjectsHandler,
	getMyProjectsHandler,
	getSpecificProjectHandler,
	updateProjectHandler,
	deleteProjectHandler,
	scheduleTeamMemberNotifications,
};
