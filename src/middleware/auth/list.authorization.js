const { MODEL_PROPERTIES } = require('../../constants');
const { List, Project, Team } = require('../../db/models');

async function listToLeaderAuth(req, res, next) {
	try {
		const list = await List.findById(req.params.listId);
		if (!list) {
			res.status(404);
			throw new Error('List not found');
		}
		// await list
		// 	.populate({
		// 		path: 'projectId',
		// 		model: MODEL_NAMES.PROJECT,
		// 		populate: {
		// 			path: 'teamId',
		// 			model: MODEL_NAMES.TEAM,
		// 		},
		// 	})
		// 	.execPopulate();
		const project = await Project.findById(list.projectId).lean();
		const team = await Team.findById(project.teamId).lean();
		if (!req.admin && !team.leaderId.equals(req.user._id)) {
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
		const project = await Project.findById(list.projectId).lean();
		if (!req.admin && !req.user.teams.includes(project.teamId)) {
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
