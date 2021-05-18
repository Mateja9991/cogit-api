const http = require('http');
const path = require('path');
const express = require('express');

require('../utils').initializeEnvitonment();
require('../utils').rescheduleNotifications();

require('./db/mongoose');

const router = require('./routers');

const app = express();
const server = http.createServer(app);

const SocketService = require('./socket/socket');
SocketService.initializeSocketServer(server);

const port = process.env.PORT;
const publicPath = path.join(__dirname, '../public/');

app.use(express.json());
app.use(router);
app.use(express.static(publicPath));

server.listen(port, () => {
	console.log(`Server is up on port: ${port}`);
});
