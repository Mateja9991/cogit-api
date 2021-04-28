const List = require('../../db/models/list.model');
const { MODEL_NAMES } = require('../../constants/model_names');

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
		next(e);
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
		next(e);
	}
}

module.exports = {
	listToLeaderAuth,
	listToMemberAuth,
};
