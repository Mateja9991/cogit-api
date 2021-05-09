const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const calendarSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: MODEL_PROPERTIES.TEAM.NAME,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);
calendarSchema.index({ userId: 1 }, { unique: true });
//
//
//
calendarSchema.virtual('events', {
	ref: MODEL_PROPERTIES.EVENT.NAME,
	foreignField: 'calendarId',
	localField: '_id',
});
//
//
//
const Calendar = model(MODEL_PROPERTIES.CALENDAR.NAME, calendarSchema);

module.exports = Calendar;
