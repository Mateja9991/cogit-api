const { MODEL_NAMES } = require('../../constants/model_names');
const { Task } = require('../../db/models');

async function taskToLeaderAuth(req, res, next) {
	try {
		const task = await Task.findById(req.params.taskId).populate({
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
		});
		if (!task) {
			throw new Error('Task not found');
		}
		if (task.listId.projectId.teamId.leaderId.equals(req.user._id))
			req.task = task;
		next();
	} catch (e) {
		next(e);
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
				},
			})
			.execPopulate();
		const users = await User.find({
			teams: task.listId.projectId.teamId,
		});
		if (!req.admin && !users.find((user) => user._id.equals(req.user._id))) {
			throw new Error('You are not team Member');
		}
		req.task = task;
		next();
	} catch (e) {
		next(e);
	}
}

async function assignAuth(req, res, next) {
	try {
		if (!req.task) throw new Error('You are not team leader.');
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
		if (!user.teams.includes(req.task.listId.projectId.teamId)) {
			throw new Error('User is not team Member');
		}
		req.assignee = user;
		next();
	} catch (e) {
		next(e);
	}
}

module.exports = {
	taskToLeaderAuth,
	taskToMemberAuth,
	assignAuth,
};
