const { Team } = require('../../db/models');

async function teamMemberAuth(req, res, next) {
	try {
		const team = await Team.findById(req.params.teamId);
		if (!team) {
			res.status(404);
			throw new Error('Team not found.');
		}
		const isMember = req.user.teams.includes(req.params.teamId);
		if (!req.admin && !isMember) {
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team member.'
			);
		}
		req.team = team;
		next();
	} catch (e) {
		next(e);
	}
}

async function teamLeaderAuth(req, res, next) {
	try {
		let team = await Team.findById(req.params.teamId);
		if (!team) {
			res.status(404);
			throw new Error('Team not found.');
		}
		if (!req.admin && !team.leaderId.equals(req.user._id)) {
			res.status(403);
			throw new Error(
				'Not authorized.  To access this document you need to be team leader.'
			);
		}
		req.team = team;
		next();
	} catch (e) {
		next(e);
	}
}

module.exports = {
	teamLeaderAuth,
	teamMemberAuth,
};
