const http = require('http');
const path = require('path');
const express = require('express');

require('../utils/initializeEnvironment');
require('./db/mongoose');

const userRouter = require('./routers/user.router');
const taskRouter = require('./routers/task.router');
const listRouter = require('./routers/list.router');
const projectRouter = require('./routers/project.router');
const teamRouter = require('./routers/team.router');
const calendarRouter = require('./routers/calendar.router');
const messageRouter = require('./routers/message.router');
const commentRouter = require('./routers/comment.router');
const sessionRouter = require('./routers/session.router');

const app = express();
const server = http.createServer(app);

const SocketService = require('./socket/socket');
SocketService.initializeSocketServer(server);

const port = process.env.PORT;
const publicPath = path.join(__dirname, '../public/');

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);
app.use(listRouter);
app.use(projectRouter);
app.use(teamRouter);
app.use(calendarRouter);
app.use(messageRouter);
app.use(commentRouter);
app.use(sessionRouter);
app.use(express.static(publicPath));

app.use(function (err, req, res, next) {
	console.error('Error caught.');
	return res.status(500).json({ error: err.message });
});

server.listen(port, () => {
	console.log(`Server is up on port: ${port}`);
});
