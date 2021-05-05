const Calendar = require('../db/models/calendar.model');
const Event = require('../db/models/event.model');
const { scheduleJobHandler } = require('./utils/services.utils');

async function getCalendarHandler(req, res, next) {
	try {
		const calendar = await Calendar.findOne({
			userId: req.user._id,
		});
		if (!calendar) {
			throw new Error('No Calendar');
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
