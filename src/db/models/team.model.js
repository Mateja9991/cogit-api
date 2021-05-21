const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
const Project = require('./project.model');
const User = require('./user.model');
const Session = require('./session.model');
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
		notes: [
			{
				type: String,
				trim: true,
				maxlength: [300, 'Notes maximum length is  300 characters.'],
				required: true,
			},
		],
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

teamSchema.pre('remove', async function () {
	await this.populate('projects').execPopulate();
	for (const project of this.projects) {
		await project.remove();
	}
	const session = await Session.findOne({ teamId: this._id });
	await session.remove();
});
//
//
//
const Team = model(MODEL_PROPERTIES.TEAM.NAME, teamSchema);

module.exports = Team;
