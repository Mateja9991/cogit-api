const Comment = require('../db/models/comment.model');

const {
	optionsBuilder,
	matchBuilder,
	queryHandler,
} = require('./utils/services.utils');

const selectFieldsGlobal = 'text likes -_id';

async function createCommentHandler(req, res) {
	try {
		const comment = new Comment({
			...req.body,
			creatorId: req.user._id,
			taskId: req.task._id,
		});
		await comment.save();
		res.send(comment);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getSpecificCommentHandler(req, res) {
	try {
		res.send(req.comment);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTaskCommentsHandler(req, res) {
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
		);
		res.send(comments);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function updateCommentHandler(req, res) {
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
		res.status(400).send({ error: e.message });
	}
}

async function deleteCommentHandler(req, res) {
	try {
		await deleteSingleCommentHandler(req.comment);
		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
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
};
