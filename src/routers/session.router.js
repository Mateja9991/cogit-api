const express = require('express');
const router = new express.Router();
const {
	jwtAuthMiddleware,
	teamMemberAuth,
	// sessionAuth,
} = require('../middleware/auth');
const {
	createPrivateSessionHandler,
	getUsersPrivateSessions,
	teamSessionHandler,
	getMessagesHandler,
	getOnePrivateSession,
} = require('../services/session.service');

router.post(
	'/sessions/private/:userId',
	jwtAuthMiddleware,
	createPrivateSessionHandler
);
router.get(
	'/sessions/me/private-sessions',
	jwtAuthMiddleware,
	getUsersPrivateSessions
);
router.get(
	'/sessions/me/users/:userId',
	jwtAuthMiddleware,
	getOnePrivateSession
);
router.get(
	'/sessions/teams/:teamId',
	jwtAuthMiddleware,
	teamMemberAuth,
	teamSessionHandler
);
router.get(
	'/sessions/messages/:sessionId',
	jwtAuthMiddleware,
	getMessagesHandler
);
// router.delete('/sessions/sessionId',);
module.exports = router;
