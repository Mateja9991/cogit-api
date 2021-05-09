const { Calendar } = require('../db/models');
const {
	scheduleJobHandler,
	destructureObject,
} = require('./utils/services.utils');

const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.CALENDAR.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.CALENDAR.ALLOWED_KEYS;

async function getCalendarHandler(req, res, next) {
	try {
		const calendar = await Calendar.findOne({
			userId: req.user._id,
		});
		if (!calendar) {
			res.status(404);
			throw new Error('Calendar not found');
		}
		await calendar.populate('events').execPopulate();
		res.send(calendar);
	} catch (e) {
		next(e);
	}
}

async function addEventHandler(req, res, next) {
	try {
		const newEvent = new Event({
			...req.body,
			calendarId: req.calendar._id,
		});
		await newEvent.save();
		scheduleJobHandler(
			newEvent.endDate,
			req.user._id,
			Socket,
			Event,
			newEvent._id
		);
		res.send(newEvent);
	} catch (e) {
		next(e);
	}
}

async function deleteEventHandler(req, res, next) {
	try {
		await req.event.remove();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function deleteCalendarHandler(req, res, next) {
	try {
		await req.calendar.remove();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

module.exports = {
	getCalendarHandler,
	addEventHandler,
	deleteEventHandler,
	deleteCalendarHandler,
};
