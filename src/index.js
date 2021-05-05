const http = require('http');
const path = require('path');
const express = require('express');

require('../utils').initializeEnvitonment();
require('../utils').rescheduleNotifications();

require('./db/mongoose');

const routers = require('./routers');

const app = express();
const server = http.createServer(app);

const SocketService = require('./socket/socket');
SocketService.initializeSocketServer(server);

const port = process.env.PORT;
const publicPath = path.join(__dirname, '../public/');

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
	);
	next();
});

app.use(express.json());
app.use(routers);
app.use(express.static(publicPath));

app.use(function (err, req, res, next) {
	console.error(err);
	return res.status(500).json({ error: err.message });
});

server.listen(port, () => {
	console.log(`Server is up on port: ${port}`);
});
