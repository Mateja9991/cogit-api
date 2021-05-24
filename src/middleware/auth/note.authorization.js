const { MODEL_PROPERTIES } = require('../../constants');
const { Team, Note } = require('../../db/models');

async function noteToLeaderAuth(req, res, next) {
	try {
		const note = await Note.findById(req.params.noteId);
		if (!note) {
			res.status(404);
			throw new Error('Note not found');
		}
		const team = await Team.findById(note.teamId).lean();
		if (req.admin || team.leaderId.equals(req.user._id)) {
			req.note = note;
		}
		next();
	} catch (e) {
		next(e);
	}
}

module.exports = {
	noteToLeaderAuth,
};
