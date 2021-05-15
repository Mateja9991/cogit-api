const { Comment } = require('../db/models');

const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
	destructureObject,
	newNotification,
	notifyUsers,
} = require('./utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.COMMENT.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.COMMENT.ALLOWED_KEYS;

async function createCommentHandler(req, res, next) {
	try {
		const commentObject = destructureObject(req.body, allowedKeys.CREATE);
		const comment = new Comment({
			...commentObject,
			creatorId: req.user._id,
			taskId: req.task._id,
		});
		await comment.save();
		await notifyUsers(req.task.editors, {
			event: {
				text: `${req.user.username} has posted a comment on your task ${req.task.name}.`,
				reference: comment,
			},
		});
		res.send(comment);
	} catch (e) {
		next(e);
	}
}

async function getSpecificCommentHandler(req, res, next) {
	try {
		res.send(req.comment);
	} catch (e) {
		next(e);
	}
}

async function getTaskCommentsHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		const comments = await Comment.find(
			{
				taskId: req.task._id,
				...match,
			},
			selectFields,
			options
		).lean();
		res.send(comments);
	} catch (e) {
		next(e);
	}
}

async function updateCommentHandler(req, res, next) {
	try {
		const updates = Object.keys(req.body);
		const isValidUpdate = updates.every((update) =>
			allowedKeys.UPDATE.includes(update)
		);
		if (!isValidUpdate) {
			res.status(422);
			throw new Error('Invalid update fields');
		}
		updates.forEach((update) => {
			req.comment[update] = req.body[update];
		});
		await req.comment.save();
		res.send(req.comment);
	} catch (e) {
		next(e);
	}
}

async function likeCommentHandler(req, res, next) {
	try {
		const index = req.comment.likes.findIndex((userId) =>
			userId.equals(req.user._id)
		);
		if (index !== -1) {
			req.comment.likes = req.comment.likes
				.slice(0, index)
				.concat(req.comment.likes.slice(index + 1));
		} else {
			req.comment.likes.push(req.user._id);
		}

		await req.comment.save();
		res.send(req.comment);
	} catch (e) {
		next(e);
	}
}

async function deleteCommentHandler(req, res, next) {
	try {
		await deleteSingleCommentHandler(req.comment);
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function deleteSingleCommentHandler(comment) {
	await comment.remove();
}

module.exports = {
	createCommentHandler,
	getTaskCommentsHandler,
	getSpecificCommentHandler,
	updateCommentHandler,
	deleteCommentHandler,
	deleteSingleCommentHandler,
	likeCommentHandler,
};
