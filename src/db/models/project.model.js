const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const projectSchema = new Schema({
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
	isTeamplate: {
		type: Boolean,
		default: false,
	},
	links: [
		{
			type: String,
			required: true,
		},
	],
});
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
const Project = model(MODEL_NAMES.PROJECT, projectSchema);

module.exports = Project;
