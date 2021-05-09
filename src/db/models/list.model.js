const { response } = require('express');
const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const listSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		order: {
			type: Number,
			set: function (order) {
				this._previousOrder = this.order;
				return order;
			},
		},
		projectId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.PROJECT.NAME,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);
listSchema.index({ name: 1, projectId: 1 }, { unique: true });
listSchema.index({ projectId: 1 });
//
//              Virtuals
//
listSchema.virtual('tasks', {
	ref: MODEL_PROPERTIES.TASK.NAME,
	localField: '_id',
	foreignField: 'listId',
});
//
//
//
listSchema.pre('save', async function (next) {
	const numOfLists = (await List.find({ projectId: this.projectId })).length;
	if (!this.order) {
		this.order = numOfLists;
	}
	if (this.order > numOfLists) {
		throw new Error('Invalid list order.');
	}
	next();
});
listSchema.pre('find', async function (next) {
	this.sort({ order: 1 });
	next();
});
listSchema.methods.changeOrder = async function () {
	const numberOfLists = await List.countDocuments();
	const start = Math.min(this._previousOrder, this.order);
	const end = Math.max(this._previousOrder, this.order);
	const lists = await List.find({
		_id: { $ne: this._id },
		projectId: this.projectId,
		order: { $gte: start, $lte: end },
	});
	console.log(lists);
	const increment = this._previousOrder > this.order ? 1 : -1;
	for (const list of lists) {
		list.order += increment;
		await list.save();
	}
};

//
//
//
const List = model(MODEL_PROPERTIES.LIST.NAME, listSchema);

module.exports = List;
