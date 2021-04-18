const Comment = require('../../db/models/comment.model');
const { MODEL_NAMES } = require('../../constants/model_names');

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
	commentToLeaderAuth,
};
