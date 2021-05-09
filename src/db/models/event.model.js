const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
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
		ref: MODEL_PROPERTIES.CALENDAR.NAME,
		type: Schema.Types.ObjectId,
		required: true,
	},
});
eventSchema.index({ calendarId: 1 });
//
//
//
const Event = model(MODEL_PROPERTIES.EVENT.NAME, eventSchema);

module.exports = Event;
