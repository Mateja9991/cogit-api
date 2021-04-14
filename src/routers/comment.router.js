const express = require('express');
const {
	jwtAuthMiddleware,
	taskToMemberAuth,
	ownershipAuthMiddleware,
	commentToLeaderAuth,
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
	'/comments/tasks/:taskId',
	jwtAuthMiddleware,
	taskToMemberAuth,
	createCommentHandler
);

router.get(
	'/comments/tasks/:taskId',
	jwtAuthMiddleware,
	taskToMemberAuth,
	getTaskCommentsHandler
);

// router.get('/comment/:commentId', jwtAuthMiddleware, taskToMemberAuth, getSpecificCommentHandler);

router.patch(
	'/comments/:commentId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Comment,
		'params.commentId',
		'comment',
		'creatorId',
		'user._id'
	),
	updateCommentHandler
);

router.delete(
	'/comments/:commentId',
	jwtAuthMiddleware,
	commentToLeaderAuth,
	ownershipAuthMiddleware(
		Comment,
		'params.commentId',
		'comment',
		'creatorId',
		'user._id'
	),
	deleteCommentHandler
);

module.exports = router;
