const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const messageSchema = new Schema(
	{
		text: {
			type: String,
			required: true,
			maxlength: [250, 'Message too long. (>250)'],
		},
		sessionId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.SESSION.NAME,
		},
		from: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.USER.NAME,
		},
	},
	{ timestamps: true }
);
messageSchema.index({ sessionId: 1 });
//
//
//
const Message = model(MODEL_PROPERTIES.MESSAGE.NAME, messageSchema);

module.exports = Message;
