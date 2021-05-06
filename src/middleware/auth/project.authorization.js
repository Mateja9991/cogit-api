const { Project } = require('../../db/models');

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
		next(e);
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
		next(e);
	}
}

module.exports = {
	projectToLeaderAuth,
	projectToMemberAuth,
};
