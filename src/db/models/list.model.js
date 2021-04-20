const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const listSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		projectId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_NAMES.PROJECT,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);
//
//              Virtuals
//
listSchema.virtual('tasks', {
	ref: MODEL_NAMES.TASK,
	localField: '_id',
	foreignField: 'listId',
});
//
//
//
const List = model(MODEL_NAMES.LIST, listSchema);

module.exports = List;
