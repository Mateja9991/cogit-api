const { scheduleJobHandler } = require('../src/services/utils/services.utils');
const Task = require('../src/db/models/task.model');
const Project = require('../src/db/models/project.model');
const User = require('../src/db/models/user.model');
const Socket = require('../src/socket/socket');

function rescheduleNotifications() {
	(async () => {
		const tasks = await Task.find({});
		const projects = await Project.find({});
		tasks.forEach((task) => {
			task.editors.forEach((editorId) => {
				scheduleJobHandler(task.deadline, task.name, editorId, Socket);
			});
		});
		for (const project of projects) {
			let teamMembers = await User.find({ teams: project.teamId });
			teamMembers.forEach((member) => {
				scheduleJobHandler(project.deadline, project.name, member._id, Socket);
			});
		}
		return 'rescheduling notifications done.';
	})()
		.then((msg) => console.log(msg))
		.catch((msg) => console.log(msg));
}

module.exports = rescheduleNotifications;
