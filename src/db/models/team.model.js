const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const teamSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	leaderId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: MODEL_NAMES.USER,
	},
});
//
//              Virtuals
//
teamSchema.virtual('projects', {
	ref: MODEL_NAMES.PROJECT,
	localField: '_id',
	foreignField: 'teamId',
});
//
//
//
const Team = model(MODEL_NAMES.TEAM, teamSchema);

module.exports = Team;
