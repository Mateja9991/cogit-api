const { MODEL_NAMES } = require('../../constants/model_names');
const { List } = require('../../db/models');

async function listToLeaderAuth(req, res, next) {
	try {
		const list = await List.findById(req.params.listId);
		if (!list) {
			res.status(404);
			throw new Error('List not found');
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
			throw new Error(
				'Not authorized.  To access this document you need to be team leader.'
			);
		}
		req.list = list;
		next();
	} catch (e) {
		next(e);
	}
}

async function listToMemberAuth(req, res, next) {
	try {
		const list = await List.findById(req.params.listId);
		if (!list) {
			res.status(404);
			throw new Error('List not found');
		}
		await list.populate('projectId').execPopulate();
		if (!req.admin && !req.user.teams.includes(list.projectId.teamId)) {
			res.status(403);
			throw new Error(
				'Not authorized. To access this document you need to be team member.'
			);
		}
		req.list = list;
		next();
	} catch (e) {
		next(e);
	}
}

module.exports = {
	listToLeaderAuth,
	listToMemberAuth,
};
