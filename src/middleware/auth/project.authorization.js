const { Project } = require('../../db/models');

async function projectToLeaderAuth(req, res, next) {
	try {
		const project = await Project.findById(req.params.projectId);
		if (!project) {
			res.status(404);
			throw new Error('There is no project');
		}
		await project.populate('teamId').execPopulate();
		if (!req.admin && !req.user._id.equals(project.teamId.leaderId)) {
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team leader.'
			);
		}
		req.project = project;
		next();
	} catch (e) {
		next(e);
	}
}

async function projectToMemberAuth(req, res, next) {
	try {
		let project = await Project.findById(req.params.projectId);
		if (!project) {
			res.status(404);
			throw new Error('Project not found');
		}
		if (!req.admin && !req.user.teams.includes(project.teamId)) {
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team member.'
			);
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
