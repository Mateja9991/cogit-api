const Team = require('../../db/models/team.model');
const Task = require('../../db/models/task.model');
const User = require('../../db/models/user.model');
const Project = require('../../db/models/project.model');
const List = require('../../db/models/list.model');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Autentifikacije
//

async function teamMemberAuth(req, res, next) {
	try {
		const isMember = req.user.teams.includes(req.params.teamId);
		if (!req.admin && !isMember) {
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
		let team;
		if (!req.admin) {
			team = await Team.findOne({
				_id: req.params.teamId,
				leaderId: req.user._id,
			});
		} else {
			team = await Team.findOne({
				_id: req.params.teamId,
			});
		}
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

async function projectToLeaderAuth(req, res, next) {
	try {
		const project = await Project.findById(req.params.projectId);
		if (!project) {
			throw new Error('There is no project');
		}
		await project.populate('teamId').execPopulate();
		if (!req.admin && !req.user._id.equals(project.teamId.leaderId)) {
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
		let project;
		if (!req.admin) {
			project = await Project.findOne({
				_id: req.params.projectId,
				teamId: { $in: req.user.teams },
			});
		} else {
			project = await Project.findOne({
				_id: req.params.projectId,
			});
		}
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
		if (!req.admin && !list.projectId.teamId.leaderId.equals(req.user._id)) {
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
		if (!req.admin && !req.user.teams.includes(list.projectId.teamId)) {
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
		if (
			!req.admin &&
			!task.listId.projectId.teamId.leaderId.equals(req.user._id)
		) {
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
		if (!req.admin && !users.includes(req.user)) {
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

async function assignAuth(req, res, next) {
	try {
		await req.task
			.populate({
				path: 'listId',
				model: MODEL_NAMES.LIST,
				populate: {
					path: 'projectId',
					model: MODEL_NAMES.PROJECT,
				},
			})
			.execPopulate();
		const user = await User.findById(req.params.userId);
		if (!user.teams.includes(task.listId.projectId.teamId)) {
			throw new Error('User is not team Member');
		}
		req.assignee = user;
		next();
	} catch (e) {
		res.status(401).send({
			error: e.message,
		});
	}
}

async function commentToLeaderAuth(req, res, next) {
	try {
		const comment = await Comment.findById(req.params.commentId);
		if (!comment) {
			throw new Error('Task not found');
		}
		await comment
			.populate({
				path: 'taskId',
				model: MODEL_NAMES.LIST,
				populate: {
					path: 'listId',
					model: MODEL_NAMES.PROJECT,
					populate: {
						path: 'projectId',
						model: MODEL_NAMES.PROJECT,
						populate: {
							path: 'teamId',
							model: MODEL_NAMES.TEAM,
						},
					},
				},
			})
			.execPopulate();
		if (
			!req.admin &&
			!comment.taskId.listId.projectId.teamId.leaderId.equals(req.user._id)
		) {
			throw new Error('User is not team Leader');
		}
		req.comment = comment;
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
	assignAuth,
	commentToLeaderAuth,
};
