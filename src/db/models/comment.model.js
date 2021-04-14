const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');

//
//              Schema
//
const commentSchema = new Schema({
	text: {
		type: String,
		required: true,
		maxlength: [250, 'Comment too long. (>250)'],
	},
	likes: {
		type: Number,
		default: 0,
	},
	taskId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_NAMES.TASK,
	},
	creatorId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_NAMES.USER,
	},
});
//
//
//
const Comment = model(MODEL_NAMES.COMMENT, commentSchema);

module.exports = Comment;
