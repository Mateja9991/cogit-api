const express = require('express');
const {
	jwtAuthMiddleware,
	taskToMemberAuth,
	taskToLeaderAuth,
	ownershipAuthMiddleware,
} = require('../middleware/auth');
const {
	createCommentHandler,
	getTaskCommentsHandler,
	getSpecificCommentHandler,
	updateCommentHandler,
	deleteCommentHandler,
} = require('../services/comment.service');

const Comment = require('../db/models/comment.model');

const router = new express.Router();
//
//              ROUTES
//
router.post(
	'/comment/:taskId',
	jwtAuthMiddleware,
	taskToMemberAuth,
	createCommentHandler
);

router.get(
	'/comment/:taskId',
	jwtAuthMiddleware,
	taskToMemberAuth,
	getTaskCommentsHandler
);

// router.get('/comment/:commentId', jwtAuthMiddleware, taskToMemberAuth, getSpecificCommentHandler);

router.get(
	'/comment/:commentId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(Comment, 'params.commentId', 'comment', 'user._id'),
	updateCommentHandler
);

router.delete('/comment/:commentId', jwtAuthMiddleware, deleteCommentHandler);

module.exports = router;
