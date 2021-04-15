const { Server: SocketServer } = require('socket.io');
const User = require('../db/models/user.model');
const Session = require('../db/models/session.model');
const {
	sendMessageEventHandler,
	sendMessageToSessionHandler,
	newSessionHandler,
	getSessionHandler,
	getNotificationsHandler,
} = require('../services/socket.services');

class SocketService {
	initializeSocketServer(server) {
		this.io = new SocketServer(server, {});
		this.io.on('connection', this._socketOnConnect);
	}

	_socketOnConnect(socketClient) {
		socketClient.on('authenticate', async ({ token }) => {
			const { _id } = jwt.verify(token, process.env.TOKEN_KEY);
			const user = await User.findById(_id);
			if (user) {
				socketClient.join(user._id);
				socketClient.userId = user._id;
			} else {
				socketClient.disconnect(true);
			}
		});
		socketClient.on('disconnect', () => {
			console.log('Tab closed');
		});
		socketClient.on('logout', () => {
			socketClient.disconnect(true);
		});
		socketClient.on('checkNotifications', () => {
			getNotificationsHandler();
		});
		socketClient.on('messageToSession', (sessionId, payload) => {
			sendMessageToSession(sessionId, socketClient.userId, payload);
		});
		socketClient.on('newMessageToUser', (userId, payload) => {
			const session = getSessionHandler([socketClient.userId, userId]);
			sendMessageToSession(session._id, socketClient.userId, payload);
		});
		socketClient.on('newMessageToTeam', (teamId, payload) => {
			const session = getSessionHandler(undefined, teamId);
			sendMessageToSession(session._id, socketClient.userId, payload);
		});
	}

	broadcastEvent(eventName, payload) {
		this.io.emit(eventName, payload);
	}

	sendEventToRoom(room, eventName, payload, callback) {
		this.io.to(room).emit(eventName, payload, callback);
	}
}

module.exports = new SocketService();
