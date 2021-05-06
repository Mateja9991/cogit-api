const lodash = require('lodash');
const schedule = require('node-schedule');
const timeValues = require('../../constants/time_values');
const { SOCKET_EVENTS } = require('../../constants/socket_events');
async function duplicateHandler(model, parentPropertyPath, parentId, child) {
	const isDuplicate = await model.findOne({
		[parentPropertyPath]: parentId,
		...child,
	});
	if (isDuplicate) {
		throw new Error('There is already the same instance');
	}
}

function optionsBuilder(limit, skip, sortBy, sortValue) {
	let options = {};
	if (limit) {
		options.limit = Number(limit);
	}
	if (skip) {
		options.skip = Number(skip);
	}
	if (sortBy) {
		options.sort = {
			[sortBy]: sortValue ? Number(sortValue) : 1,
		};
	}
	console.log(limit, options);
	return options;
}

function matchBuilder(query) {
	const matchObject = query;
	delete matchObject.limit;
	delete matchObject.skip;
	delete matchObject.sortBy;
	delete matchObject.sortValue;
	return {
		...matchObject,
	};
}

function queryHandler(allItems, query) {
	const sortBy = query.sortBy;
	const sortValue = query.sortValue ? query.sortValue : 1;
	const skip = query.skip ? query.skip : 0;
	const offset = query.limit ? query.limit : allItems.length - skip;
	const match = matchBuilder(query);
	const matchKeys = Object.keys(match);

	let requestedItems = allItems.filter(
		(item) =>
			matchKeys.length ===
			matchKeys.filter((key) => lodash.get(item, key).toString() === match[key])
				.length
	);

	if (sortBy) {
		allItems.sort((a, b) => {
			let valueA = a[sortBy];
			let valueB = b[sortBy];
			if (typeof valueA === 'string' || valueA instanceof String) {
				valueA = valueA.toUpperCase();
				valueB = valueB.toUpperCase();
			}
			if (valueA < valueB) {
				return -1 * sortValue;
			}
			if (valueA > valueB) {
				return 1 * sortValue;
			}
			return 0;
		});
	}

	requestedItems = requestedItems.slice(
		Number(skip),
		Number(skip) + Number(offset)
	);

	return requestedItems;
}
function getNextTimeStamp(date) {
	let time;
	const keys = Object.keys(timeValues);
	const key = keys.find((key) => timeValues[key] < date);

	if (key) {
		time = timeValues[key];
		while (date - time - timeValues[key] > 0) time += timeValues[key];
	}

	return { time, key };
}

function scheduleJobHandler(deadline, room, Socket, model, documentId) {
	if (deadline.getTime() <= Date.now()) return;
	const workingTime = deadline.getTime() - Date.now();
	const timeObject = getNextTimeStamp(workingTime);
	schedule.scheduleJob(
		new Date(Date.now() + workingTime - timeObject.time),
		notify.bind(null, timeObject, room, Socket, model, documentId)
	);
}
function notify({ time: timeLeft, key }, room, Socket, model, documentId) {
	model
		.findById(documentId)
		.then((document) => {
			if (!document) return;
			const message = document.notificationMessage(
				timeLeft / timeValues[key],
				key
			);
			console.log(message);
			Socket.sendEventToRoom(
				room,
				SOCKET_EVENTS.NEW_NOTIFICATION,
				message,
				'users'
			);
			const timeObject = getNextTimeStamp(timeLeft);
			if (!timeObject.time) return;
			schedule.scheduleJob(
				new Date(Date.now() + timeLeft - timeObject.time),
				notify.bind(null, timeObject, room, Socket, model, documentId)
			);
		})
		.catch((error) => {
			console.log(error);
		});
}

module.exports = {
	duplicateHandler,
	optionsBuilder,
	queryHandler,
	matchBuilder,
	scheduleJobHandler,
};
