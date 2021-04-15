const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const messageSchema = new Schema({
	text: {
		type: String,
		required: true,
		maxlength: [250, 'Message too long. (>250)'],
	},
	sessionId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_NAMES.SESSION,
	},
	from: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_NAMES.USER,
	},
	sentAt: Date,
	receivedAt: Date,
});
//
//
//
const Message = model(MODEL_NAMES.MESSAGE, messageSchema);

module.exports = Message;
