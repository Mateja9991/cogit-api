const Calendar = require('../db/models/calendar.model');
const Event = require('../db/models/event.model');

async function getCalendarHandler(req, res) {
	try {
		const calendar = await Calendar.findOne({
			userId: req.user._id,
		});
		if (!calendar) {
			throw new Error('No Calendar');
		}
		res.send(calendar);
	} catch (e) {
		next(e);
	}
}

async function addEventHandler(req, res) {
	try {
		const newEvent = new Event({
			...req.body,
			calendarId: req.calendar._id,
		});
		await newEvent.save();
		res.send(newEvent);
	} catch (e) {
		next(e);
	}
}

async function deleteEventHandler(req, res) {
	try {
		await req.event.remove();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function deleteCalendarHandler(req, res) {
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
