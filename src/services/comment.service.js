const Comment = require('../db/models/comment.model');

const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
} = require('./utils/services.utils');

const selectFieldsGlobal_View = 'text taskId likes';

async function createCommentHandler(req, res, next) {
	try {
		const comment = new Comment({
			...req.body,
			creatorId: req.user._id,
			taskId: req.task._id,
		});
		await comment.save();
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
			selectFieldsGlobal_View,
			options
		);
		res.send(comments);
	} catch (e) {
		next(e);
	}
}

async function updateCommentHandler(req, res, next) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['text'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
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
		res.send(req.comment);
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
