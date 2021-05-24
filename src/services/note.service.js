const { Note } = require('../db/models');
const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
	destructureObject,
} = require('./utils/services.utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.NOTE.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.NOTE.ALLOWED_KEYS;

async function createNoteHandler(req, res, next) {
	try {
		const noteObject = destructureObject(req.body, allowedKeys.CREATE);
		const note = new Comment({
			...noteObject,
			creatorId: req.user._id,
			teamId: req.team._id,
		});
		await note.save();
		await notifyUsers(req.task.editors, {
			event: {
				text: `${req.user.username} has posted a note in team ${req.team.name}.`,
				reference: note,
			},
		});
		res.send(note);
	} catch (e) {
		next(e);
	}
}

async function getTeamNotesHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			'createdAt',
			1
		);
		const match = matchBuilder(req.query);
		const notes = await Note.find(
			{
				teamId: req.team._id,
				...match,
			},
			selectFields,
			options
		);
		res.send(notes);
	} catch (e) {
		next(e);
	}
}

async function updateNoteHandler(req, res, next) {
	try {
		req.team.notes = [];
		// const index = req.team.notes.findIndex((item) =>
		// 	item._id.equals(req.query.noteId)
		// );
		// if (index == -1) {
		// 	res.status(404);
		// 	throw new Error('Note not found');
		// }
		await req.team.save();
		res.send(req.team.notes);
	} catch (e) {
		next(e);
	}
	// const url = new URL(updates.link);
	// if (url.protocol !== 'http:' && url.protocol !== 'https:') {
	// 	res.status(422);
	// 	throw new Error('Invalid protocol');
	// }
}
async function deleteNoteHandler(req, res, next) {
	try {
		req.team.notes = [];
		// const index = req.team.notes.findIndex((item) =>
		// 	item._id.equals(req.query.noteId)
		// );
		// if (index == -1) {
		// 	res.status(404);
		// 	throw new Error('Note not found');
		// }
		await req.team.save();
		res.send(req.team.notes);
	} catch (e) {
		next(e);
	}
}

module.exports = {
	createNoteHandler,
	getTeamNotesHandler,
	updateNoteHandler,
	deleteNoteHandler,
};
