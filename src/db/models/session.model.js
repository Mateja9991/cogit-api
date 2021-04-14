const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const sessionSchema = new Schema({
	participants: [
		{
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_NAMES.USER,
		},
	],
	messages: [
		{
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_NAMES.MESSAGE,
		},
	],
});
//
//              Middleware
//
const Session = model(MODEL_NAMES.SESSION, sessionSchema);

module.exports = Session;
