const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const sessionSchema = new Schema({
	teamId: {
		type: Schema.Types.ObjectId,
		ref: MODEL_NAMES.TEAM,
		sparse: true,
	},
	participants: [
		{
			newMessages: {
				type: Number,
				default: 0,
			},
			userId: {
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_NAMES.USER,
			},
		},
	],
});
//
//              Middleware
//
const Session = model(MODEL_NAMES.SESSION, sessionSchema);

module.exports = Session;
