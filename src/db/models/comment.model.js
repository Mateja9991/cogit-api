const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const commentSchema = new Schema({
	text: {
		type: String,
		required: true,
		maxlength: [250, 'Comment too long. (>250)'],
	},
	likes: [
		{
			type: Schema.Types.ObjectId,
			ref: MODEL_PROPERTIES.USER.NAME,
			required: true,
		},
	],
	taskId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_PROPERTIES.TASK.NAME,
	},
	creatorId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_PROPERTIES.USER.NAME,
	},
});
commentSchema.index({ creatorId: 1 });
commentSchema.index({ taskId: 1 });
//
//
//
commentSchema.methods.toJSON = function () {
	const commentObject = this.toObject();
	commentObject.likes = commentObject.likes.length;
	return commentObject;
};

const Comment = model(MODEL_PROPERTIES.COMMENT.NAME, commentSchema);

module.exports = Comment;
