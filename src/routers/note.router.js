const express = require('express');

const { Note } = require('../db/models');

const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	teamMemberAuth,
	noteToLeaderAuth,
} = require('../middleware/auth');
const {
	createNoteHandler,
	getTeamNotesHandler,
	updateNoteHandler,
	deleteNoteHandler,
} = require('../services/note.service');

const router = new express.Router();

router.post(
	'/notes/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	createNoteHandler
);

router.get(
	'/notes/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	getTeamNotesHandler
);

router.patch(
	'/notes/:noteId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Note,
		'params.noteId',
		'note',
		'creatorId',
		'user._id'
	),
	updateNoteHandler
);

router.delete(
	'/notes/:noteId',
	jwtAuthMiddleware,
	noteToLeaderAuth,
	ownershipAuthMiddleware(
		Note,
		'params.noteId',
		'note',
		'creatorId',
		'user._id'
	),
	deleteNoteHandler
);

module.exports = router;
