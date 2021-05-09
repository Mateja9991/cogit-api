const express = require('express');

const { Comment } = require('../db/models');

const {
	jwtAuthMiddleware,
	taskToMemberAuth,
	ownershipAuthMiddleware,
	commentToLeaderAuth,
	commentToMemberAuth,
} = require('../middleware/auth');
const {
	createCommentHandler,
	getTaskCommentsHandler,
	getSpecificCommentHandler,
	updateCommentHandler,
	deleteCommentHandler,
	likeCommentHandler,
} = require('../services/comment.service');

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

router.patch(
	'/comments/like/:commentId',
	jwtAuthMiddleware,
	commentToMemberAuth,
	likeCommentHandler
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
