const Team = require('../../db/models/team.model');

async function teamMemberAuth(req, res, next) {
	try {
		const isMember = req.user.teams.includes(req.params.teamId);
		if (!req.admin && !isMember) {
			throw new Error('You are not team Member');
		}
		const team = await Team.findById(req.params.teamId);
		req.team = team;
		next();
	} catch (e) {
		next(e);
	}
}

async function teamLeaderAuth(req, res, next) {
	try {
		let team;
		if (!req.admin) {
			team = await Team.findOne({
				_id: req.params.teamId,
				leaderId: req.user._id,
			});
		} else {
			team = await Team.findOne({
				_id: req.params.teamId,
			});
		}
		if (!team) {
			throw new Error('You are not team Leader');
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
