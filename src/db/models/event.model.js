const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const eventSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	startDate: {
		type: Date,
		required: true,
	},
	endDate: {
		type: Date,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	calendarId: {
		ref: MODEL_NAMES.CALENDAR,
		type: Schema.Types.ObjectId,
		required: true,
	},
});
eventSchema.index({ calendarId: 1 });
//
//
//
const Event = model(MODEL_NAMES.EVENT, eventSchema);

module.exports = Event;
