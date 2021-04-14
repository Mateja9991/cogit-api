const Team = require('../../db/models/team.model');
const Task = require('../../db/models/task.model');
const User = require('../../db/models/user.model');
const Project = require('../../db/models/project.model');
const List = require('../../db/models/list.model');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Autentifikacije
//

async function projectToLeaderAuth(req, res, next) {
	try {
		const project = await Project.findById(req.params.projectId);
		if (!project) {
			throw new Error('There is no project');
		}
		await project.populate('teamId').execPopulate();
		if (!req.user._id.equals(project.teamId.leaderId)) {
			throw new Error('You are not team Leader');
		}
		req.project = project;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function projectToMemberAuth(req, res, next) {
	try {
		const project = await Project.findOne({
			_id: req.params.projectId,
			teamId: { $in: req.user.teams },
		});
		if (!project) {
			throw new Error('There is no project');
		}
		req.project = project;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function teamMemberAuth(req, res, next) {
	try {
		const isMember = req.user.teams.includes(req.params.teamId);
		if (!isMember) {
			throw new Error('You are not team Member');
		}
		const team = await Team.findById(req.params.teamId);
		req.team = team;
		next();
	} catch (e) {
		res.status(401).send({
			error: 'You are not team Member.',
		});
	}
}

async function teamLeaderAuth(req, res, next) {
	try {
		const team = await Team.findOne({
			_id: req.params.teamId,
			leaderId: req.user._id,
		});
		if (!team) {
			throw new Error('You are not team Leader');
		}
		req.team = team;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function listToLeaderAuth(req, res, next) {
	try {
		const list = await List.findById(req.params.listId);
		if (!list) {
			throw new Error('Didnt find list');
		}
		await list
			.populate({
				path: 'projectId',
				model: MODEL_NAMES.PROJECT,
				populate: {
					path: 'teamId',
					model: MODEL_NAMES.TEAM,
				},
			})
			.execPopulate();
		if (!list.projectId.teamId.leaderId.equals(req.user._id)) {
			throw new Error('You are not team leader');
		}
		req.list = list;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function listToMemberAuth(req, res, next) {
	try {
		const list = await List.findById(req.params.listId);
		if (!list) {
			throw new Error('Didnt find list');
		}
		await list.populate('projectId').execPopulate();
		if (!req.user.teams.includes(list.projectId.teamId)) {
			throw new Error('You are not team leader');
		}
		req.list = list;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function taskToLeaderAuth(req, res, next) {
	try {
		const task = await Task.findById(req.params.taskId);
		if (!task) {
			throw new Error('Task not found');
		}
		await task
			.populate({
				path: 'listId',
				model: MODEL_NAMES.LIST,
				populate: {
					path: 'projectId',
					model: MODEL_NAMES.PROJECT,
					populate: {
						path: 'teamId',
						model: MODEL_NAMES.TEAM,
					},
				},
			})
			.execPopulate();
		if (!task.listId.projectId.teamId.leaderId.equals(req.user._id)) {
			throw new Error('You are not team Leader');
		}
		req.task = task;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function taskToMemberAuth(req, res, next) {
	try {
		const task = await Task.findById(req.params.taskId);
		if (!task) {
			throw new Error('Task not found');
		}
		await task
			.populate({
				path: 'listId',
				model: MODEL_NAMES.LIST,
				populate: {
					path: 'projectId',
					model: MODEL_NAMES.PROJECT,
					populate: {
						path: 'teamId',
						model: MODEL_NAMES.TEAM,
					},
				},
			})
			.execPopulate();
		const users = await User.find({
			teams: { $elemMatch: task.listId.projectId.teamId },
		});
		if (!users.includes(req.user)) {
			throw new Error('You are not team Member');
		}
		req.task = task;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

module.exports = {
	taskToLeaderAuth,
	taskToMemberAuth,
	teamMemberAuth,
	teamLeaderAuth,
	projectToLeaderAuth,
	projectToMemberAuth,
	listToMemberAuth,
	listToLeaderAuth,
};
