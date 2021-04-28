// const { Server: SocketServer } = require('socket.io');
var mongoose = require('mongoose');
const socketio = require('socket.io');

const User = require('../db/models/user.model');
const Session = require('../db/models/session.model');
const Message = require('../db/models/message.model');

const { getSessionHandler } = require('../services/session.service');
const { SOCKET_EVENTS } = require('../constants/socket_events');
const { jwtSocketAuth } = require('./socket.auth/');
const Team = require('../db/models/team.model');

class SocketService {
	initializeSocketServer(server) {
		this.io = socketio(server);
		this.io.on('connection', () => {
			console.log('Visitor connected');
		});
		this.io
			.of('/users')
			.use(this.middleware)
			.on('connection', this._userOnConnect);
	}
	async middleware(socketClient, next) {
		const user = await jwtSocketAuth(socketClient.handshake.query.token);
		if (user) {
			socketClient.user = user;
			socketClient.join(socketClient.user._id.toString(), function () {});
			socketClient.emit(SOCKET_EVENTS.NEW_MESSAGE, {
				text: 'Hello!  ',
				username: socketClient.user.username,
			});
			next();
		} else {
			next(new Error('not Authorized'));
		}
	}
	_userOnConnect(socketClient) {
		socketClient.on('disconnect', () => {
			console.log('Tab closed');
		});
		socketClient.on('logout', () => {
			socketClient.disconnect(true);
		});
		socketClient.on('checkNotifications', async () => {});
		socketClient.on('newMessageToSession', async (sessionId, payload) => {
			sessionId = mongoose.Types.ObjectId(sessionId);
			await sendMessageToSessionHandler(
				sessionId,
				socketClient.user._id,
				payload
			);
		});
		socketClient.on('newMessageToUser', async (email, payload) => {
			try {
				const user = await User.findOne({
					email,
				});
				if (!user) {
					throw new Error('No user');
				}
				const sessionParticipants = [socketClient.user._id, user._id];
				const session = await getSessionHandler(sessionParticipants);
				await sendMessageToSessionHandler(
					session._id,
					socketClient.user._id,
					payload
				);
			} catch (e) {
				console.log(e);
			}
		});
		socketClient.on('newMessageToTeam', async (teamId, payload, callback) => {
			try {
				teamId = mongoose.Types.ObjectId(teamId);
				const team = await Team.findById(teamId);
				if (!team) {
					throw new Error('No such team');
				}
				const session = await getSessionHandler(undefined, teamId);
				await sendMessageToSessionHandler(
					session._id,
					socketClient.user._id,
					payload
				);
				callback('done');
			} catch (e) {
				console.log(e);
			}
		});
	}

	broadcastEvent(eventName, payload) {
		this.io.emit(eventName, payload);
	}

	sendEventToRoom(room, eventName, payload, namespace) {
		this.io
			.of('/' + namespace)
			.to(room)
			.emit(eventName, payload);
	}
}
const Socket = new SocketService();

async function sendMessageEvent(room, payload) {
	Socket.sendEventToRoom(room, SOCKET_EVENTS.NEW_MESSAGE, payload, 'users');
}

async function sendMessageToSessionHandler(sessionId, senderId, message) {
	try {
		let session = await Session.findById(sessionId);
		const sender = await User.findById(senderId);
		if (!session) {
			throw new Error('No session');
		}
		const msg = new Message({
			text: message,
			sessionId: sessionId,
			from: sender.username,
		});
		await msg.save();
		session.participants.forEach((participant) => {
			if (!participant.userId.equals(senderId)) {
				participant.newMessages = participant.newMessages++;
			}
		});
		for (const participant of session.participants) {
			if (!participant.userId.equals(senderId)) {
				sendMessageEvent(participant.userId, {
					username: sender.username,
					message,
				});
			}
		}
	} catch (e) {
		console.log(e);
	}
}

module.exports = Socket;
