const { Note, Team } = require('../db/models');
const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
	destructureObject,
	notifyUsers,
	checkAndUpdate,
} = require('./utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.NOTE.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.NOTE.ALLOWED_KEYS;

async function createNoteHandler(req, res, next) {
	try {
		const noteObject = destructureObject(req.body, allowedKeys.CREATE);
		const note = new Note({
			...noteObject,
			creatorId: req.user._id,
			teamId: req.team._id,
		});
		await note.save();
		await req.team.populate('members').execPopulate();
		await notifyUsers(req.team.members, {
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
			-1
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
		for (const note of notes) {
			await note
				.populate('creatorId', MODEL_PROPERTIES.USER.SELECT_FIELDS)
				.execPopulate();
			await note.creatorId.populate('avatar').execPopulate();
		}
		res.send(notes);
	} catch (e) {
		next(e);
	}
}

async function updateNoteHandler(req, res, next) {
	try {
		await checkAndUpdate('NOTE', req.note, req.body, res);
		res.send(req.note);
	} catch (e) {
		next(e);
	}
}
async function deleteNoteHandler(req, res, next) {
	try {
		await req.note.remove();
		const team = await Team.findById(req.note.teamId);
		await team.populate('notes').execPopulate();
		res.send(team.notes);
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
