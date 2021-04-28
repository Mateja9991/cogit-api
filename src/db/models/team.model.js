const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
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
			ref: MODEL_NAMES.USER,
		},
		visit: [
			{
				userId: {
					type: Schema.Types.ObjectId,
					required: true,
				},
				dates: [
					{
						type: Date,
						required: true,
					},
				],
			},
		],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

teamSchema.index({ name: 1, leaderId: 1 }, { unique: true });
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
