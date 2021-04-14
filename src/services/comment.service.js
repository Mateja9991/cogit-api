const Comment = require('../db/models/comment.model');

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
		await comment.save();
		res.send(comment);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTaskCommentsHandler(req, res) {
	try {
		const comments = Comment.find({
			taskId: req.task._id,
		});
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
		await req.comment.remove();
		res.send(task);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

module.exports = {
	createCommentHandler,
	getTaskCommentsHandler,
	getSpecificCommentHandler,
	updateCommentHandler,
	deleteCommentHandler,
};
