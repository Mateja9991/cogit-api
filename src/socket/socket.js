const { Server: SocketServer } = require('socket.io');
const User = require('../db/models/user.model');

class SocketService {
	initializeSocketServer(server) {
		this.io = new SocketServer(server, {});
		this.io.on('connection', this._socketOnConnect);
	}

	_socketOnConnect(socketClient) {
		this.io.on('authenticate', async ({ token }) => {
			const { _id } = jwt.verify(token, process.env.TOKEN_KEY);
			const user = await User.findById(_id);
			if (user) {
				socketClient.join(user._id);
			}
		});
		this.io.on('disconnect', () => {
			console.log('Tab closed');
		});
		this.io.on('logout', () => {
			socketClient.disconnect(true);
		});
	}

	sendEvent(eventName, payload) {
		this.io.emit(eventName, payload);
	}

	sendEventToRoom(room, eventName, payload) {
		this.io.to(room).emit(eventName, payload);
	}
}

module.exports = new SocketService();
