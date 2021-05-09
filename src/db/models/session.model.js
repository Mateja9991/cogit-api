const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
const User = require('./user.model');
//
//              Schema
//
const sessionSchema = new Schema({
	teamId: {
		type: Schema.Types.ObjectId,
		ref: MODEL_PROPERTIES.TEAM.NAME,
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
				ref: MODEL_PROPERTIES.USER.NAME,
			},
		},
	],
});
//
//              Middleware
//
sessionSchema.methods.updateParticipants = async function () {};
//
const Session = model(MODEL_PROPERTIES.SESSION.NAME, sessionSchema);

module.exports = Session;
