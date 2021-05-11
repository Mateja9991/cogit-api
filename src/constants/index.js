const { MODEL_PROPERTIES } = require('./model_properties');
const { SOCKET_EVENTS } = require('./socket_events');
const { PING_INTERVAL, RESPONSE_TIMER } = require('./socket_constants');
const TIME_VALUES = require('./time_values');

module.exports = {
	MODEL_PROPERTIES,
	SOCKET_EVENTS,
	TIME_VALUES,
	RESPONSE_TIMER,
	PING_INTERVAL,
};
