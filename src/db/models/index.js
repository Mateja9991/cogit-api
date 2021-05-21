const Avatar = require('./avatar.model');
const Calendar = require('./calendar.model');
const Event = require('./event.model');
const User = require('./user.model');
const Session = require('./session.model');
const Message = require('./message.model');
const Team = require('./team.model');
const Project = require('./project.model');
const List = require('./list.model');
const Task = require('./task.model');
const Comment = require('./comment.model');

// Project.find({}).then((projects) => {
// 	for (const project of projects) {
// 		project.remove().then(() => {
// 			console.log('ok');
// 		});
// 	}
// });

module.exports = {
	Avatar,
	Calendar,
	Event,
	User,
	Session,
	Message,
	Team,
	Project,
	List,
	Task,
	Comment,
};
