const Comment = require('../../db/models/comment.model');
const { MODEL_NAMES } = require('../../constants/model_names');
const Team = require('../../db/models/team.model');
const User = require('../../db/models/user.model');
async function commentToLeaderAuth(req, res, next) {
	try {
		const comment = await Comment.findById(req.params.commentId);
		if (!comment) {
			throw new Error('Comment not found');
		}
		await comment
			.populate({
				path: 'taskId',
				model: MODEL_NAMES.TASK,
				populate: {
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
				},
			})
			.execPopulate();
		if (
			req.admin ||
			comment.taskId.listId.projectId.teamId.leaderId.equals(req.user._id)
		) {
			req.comment = comment;
		}
		next();
	} catch (e) {
		next(e);
	}
}
async function commentToMemberAuth(req, res, next) {
	try {
		const comment = await Comment.findById(req.params.commentId);
		if (!comment) {
			throw new Error('Comment not found');
		}
		await comment
			.populate({
				path: 'taskId',
				model: MODEL_NAMES.TASK,
				populate: {
					path: 'listId',
					model: MODEL_NAMES.LIST,
					populate: {
						path: 'projectId',
						model: MODEL_NAMES.PROJECT,
					},
				},
			})
			.execPopulate();
		if (!req.user.teams.includes(comment.taskId.listId.projectId.teamId)) {
			throw new Error('Not a team member.');
		}
		req.comment = comment;
		next();
	} catch (e) {
		next(e);
	}
}

module.exports = {
	commentToLeaderAuth,
	commentToMemberAuth,
};
