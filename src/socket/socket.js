// const { Server: SocketServer } = require('socket.io');
var mongoose = require('mongoose');
const socketio = require('socket.io');

const { User, Team, Session, Message } = require('../db/models');
const OnlineUsersServices = require('./utils/socket.utils');

const { getSessionHandler } = require('../services/session.service');
const {
	SOCKET_EVENTS,
	PING_INTERVAL,
	RESPONSE_TIMER,
} = require('../constants');
const { jwtSocketAuth } = require('./socket.auth/');
const { startSession } = require('../db/models/avatar.model');

class SocketService {
	initializeSocketServer(server) {
		this.io = socketio(server, {
			cors: {
				origin: '*',
				methods: '*',
				allowedHeaders: ['my-custom-header'],
				credentials: true,
			},
		});
		this.io.on('connect', () => {
			console.log('Visitor connected');
		});
		this.io
			.of('/users')
			// .use(this.middleware.bind(this))
			.on('connect', this._userOnConnect.bind(this));
		setInterval(() => this.pingActiveUsers(), PING_INTERVAL);
	}
	async pingActiveUsers() {
		const activeUsers = await User.find({ active: true });
		activeUsers.forEach((user) => {
			OnlineUsersServices.pingUser(user._id);
			this.sendEventToRoom(
				user._id,
				SOCKET_EVENTS.CHECK_CONNECTION,
				{},
				'users'
			);
		});
		setTimeout(() => {
			OnlineUsersServices.clearNotResponsiveUsers(
				this.sendEventToRoom.bind(this)
			);
		}, RESPONSE_TIMER);
	}
	async middleware(socketClient, next) {
		try {
			await jwtSocketAuth(socketClient, this.sendEventToRoom.bind(this));

			if (!socketClient.user) {
				next(new Error('Not Authorized'));
			}
			next();
		} catch (e) {
			console.log(e.message);
			next(new Error('Not Authorized'));
		}
	}
	async _userOnConnect(socketClient) {
		socketClient.on('disconnect', async () => {
			console.log('Tab closed');
		});
		socketClient.on('logout', () => {
			socketClient.disconnect(true);
		});
		socketClient.on('keep-alive', () => {
			console.log('hej');
			OnlineUsersServices.connectionAlive(socketClient.user._id);
		});
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
				console.log('TO USER');
				const user = await User.findOne({
					email,
				});
				if (!user) {
					throw new Error('User not found.');
				}
				const sessionParticipants = [socketClient.user._id, user._id];
				console.log(sessionParticipants);
				const session = await getSessionHandler(sessionParticipants);
				console.log('sessionId', session._id);
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
				console.log('TO TEAM');
				teamId = mongoose.Types.ObjectId(teamId);
				const team = await Team.findById(teamId);
				if (!team) {
					throw new Error('Team not found.');
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
			throw new Error('Session not found.');
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
		// await session.populate('teamId').execPopulate();
		for (const participant of session.participants) {
			if (!participant.userId.equals(senderId)) {
				sendMessageEvent(participant.userId, {
					team: session.teamId,
					usr: sender,
					message,
				});
			}
		}
	} catch (e) {
		console.log(e);
	}
}

module.exports = Socket;
