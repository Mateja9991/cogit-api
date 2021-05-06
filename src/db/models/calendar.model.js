const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const calendarSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: MODEL_NAMES.TEAM,
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
	ref: MODEL_NAMES.EVENT,
	foreignField: 'calendarId',
	localField: '_id',
});
//
//
//
const Calendar = model(MODEL_NAMES.CALENDAR, calendarSchema);

module.exports = Calendar;
