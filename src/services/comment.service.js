const Comment = require('../db/models/comment.model');

async function createCommentHandler(req, res) {}

async function getSpecificCommentHandler(req, res) {}

async function getTaskCommentsHandler(req, res) {}

async function updateCommentHandler(req, res) {}

async function deleteCommentHandler(req, res) {}

module.exports = {
	createCommentHandler,
	getTaskCommentsHandler,
	getSpecificCommentHandler,
	updateCommentHandler,
	deleteCommentHandler,
};
