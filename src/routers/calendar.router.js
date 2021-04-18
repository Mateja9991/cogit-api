const express = require('express');
const {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
} = require('../middleware/auth');
const {
	getCalendarHandler,
	addEventHandler,
	deleteCalendarHandler,
	deleteEventHandler,
} = require('../services/calendar.service');

const Calendar = require('../db/models/calendar.model');
const Event = require('../db/models/event.model');

const router = new express.Router();
//
//              ROUTES
//
router.get('/calendars/me', jwtAuthMiddleware, getCalendarHandler);
// router.get('/comment/:commentId', jwtAuthMiddleware, taskToMemberAuth, getSpecificCommentHandler);
router.patch(
	'/calendars/:calendarId/add-event',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Calendar,
		'params.calendarId',
		'calendar',
		'userId',
		'user._id'
	),
	addEventHandler
);

router.patch(
	'/calendars/:calendarId/delete-event/:eventId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Calendar,
		'params.calendarId',
		'calendar',
		'userId',
		'user._id'
	),
	ownershipAuthMiddleware(
		Event,
		'params.eventId',
		'event',
		'calendarId',
		'calendar._id'
	),
	deleteEventHandler
);

router.delete(
	'/calendar/:calendarId',
	jwtAuthMiddleware,
	ownershipAuthMiddleware(
		Calendar,
		'params.calendarId',
		'calendar',
		'userId',
		'user._id'
	),
	deleteCalendarHandler
);

module.exports = router;
