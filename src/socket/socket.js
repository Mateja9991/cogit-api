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

var hashTable = [];

class SocketService {
	initializeSocketServer(server) {
		this.io = socketio(server);
		this.io.on('connection', this._socketOnConnect);
	}

	_socketOnConnect(socketClient) {
		// socketClient.use(jwtSocketAuth);
		console.log('New Connection');
		socketClient.on('authenticate', async ({ token }, callback) => {
			try {
				const user = await jwtSocketAuth(token);
				socketClient.join(user._id.toString(), function () {});
				socketClient.emit(SOCKET_EVENTS.NEW_MESSAGE, {
					text: 'Hello!  ',
					username: user.username,
				});
				hashTable[socketClient.id] = user._id;
				callback();
			} catch (e) {
				console.log(e);
				socketClient.disconnect(true);
			}
		});
		socketClient.on('disconnect', () => {
			console.log('Tab closed');
		});
		socketClient.on('logout', () => {
			// socketClient.disconnect(true);
		});
		socketClient.on('checkNotifications', async () => {});
		socketClient.on('messageToSession', async (sessionId, payload) => {
			sessionId = mongoose.Types.ObjectId(sessionId);
			await sendMessageToSessionHandler(
				sessionId,
				hashTable[socketClient.id],
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
				console.log(user);
				const sessionParticipants = [hashTable[socketClient.id], user._id];
				console.log(sessionParticipants);
				const session = await getSessionHandler(sessionParticipants);
				console.log(session);
				await sendMessageToSessionHandler(
					session._id,
					hashTable[socketClient.id],
					payload
				);
			} catch (e) {
				console.log(e);
			}
		});
		socketClient.on('newMessageToTeam', async (teamId, payload, callback) => {
			try {
				teamId = mongoose.Types.ObjectId(teamId);
				console.log(teamId);
				const team = await Team.findById(teamId);
				if (!team) {
					throw new Error('No such team');
				}
				const session = await getSessionHandler(undefined, teamId);
				await sendMessageToSessionHandler(
					session._id,
					hashTable[socketClient.id],
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

	sendEventToRoom(room, eventName, payload) {
		this.io.to(room).emit(eventName, payload);
	}
}
const Socket = new SocketService();

async function sendMessageEvent(room, payload) {
	Socket.sendEventToRoom(room, SOCKET_EVENTS.NEW_MESSAGE, payload);
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
