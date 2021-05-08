const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const projectSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_NAMES.TEAM,
		},
		taggs: [
			{
				type: String,
				required: true,
			},
		],
		isArchived: {
			type: Boolean,
			default: false,
		},
		isTemplate: {
			type: Boolean,
			default: false,
		},
		deadline: {
			type: Date,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		links: [
			{
				type: String,
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

projectSchema.index({ name: 1, teamId: 1 }, { unique: true });
projectSchema.index({ teamId: 1 });

//
//              Virtuals
//
projectSchema.virtual('lists', {
	ref: MODEL_NAMES.LIST,
	localField: '_id',
	foreignField: 'projectId',
});
//
//
//
projectSchema.methods.notificationMessage = function (timeLeft, timeKey) {
	return `${timeLeft} ${timeKey + (timeLeft > 1 ? 's' : '')} until ${
		this.name
	} projects deadline.`;
};

const Project = model(MODEL_NAMES.PROJECT, projectSchema);

module.exports = Project;
