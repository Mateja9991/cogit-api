const { MODEL_NAMES } = require('../../constants/model_names');
const { Comment } = require('../../db/models');

async function commentToLeaderAuth(req, res, next) {
	try {
		const comment = await Comment.findById(req.params.commentId);
		if (!comment) {
			res.status(404);
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
			res.status(404);
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
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team member'
			);
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
