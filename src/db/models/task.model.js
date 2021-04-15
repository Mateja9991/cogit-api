const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const taskSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		listId: {
			type: Schema.Types.ObjectId,
			requred: true,
			ref: MODEL_NAMES.LIST,
		},
		parentTaskId: {
			type: Schema.Types.ObjectId,
			ref: MODEL_NAMES.TASK,
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		creatorId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_NAMES.USER,
		},
		isTeamPriority: {
			type: Boolean,
			default: false,
		},
		usersPriority: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_NAMES.USER,
			},
		],
		editors: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_NAMES.USER,
			},
		],
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
taskSchema.virtual('subTasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'parentTaskId',
});
//
//
//				DOCUMENT METHODS
taskSchema.methods.toJSON = function () {
	const task = this;
	taskObject = task.toObject();
	return taskObject;
};
const Task = model(MODEL_NAMES.TASK, taskSchema);

module.exports = Task;
