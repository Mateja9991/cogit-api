const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const teamSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		leaderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.USER.NAME,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);
teamSchema.index({ leaderId: 1 });
teamSchema.index({ name: 1, leaderId: 1 }, { unique: true });
//
//              Virtuals
//
teamSchema.virtual('projects', {
	ref: MODEL_PROPERTIES.PROJECT.NAME,
	localField: '_id',
	foreignField: 'teamId',
});
//
//
//
const Team = model(MODEL_PROPERTIES.TEAM.NAME, teamSchema);

module.exports = Team;
