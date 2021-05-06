const { scheduleJobHandler } = require('../src/services/utils/services.utils');
const { Project, Task } = require('../src/db/models');

const {
	scheduleTeamMemberNotifications,
} = require('../src/services/project.service');
const {
	scheduleTaskEditorsNotifications,
} = require('../src/services/task.service');
function rescheduleNotifications() {
	(async () => {
		const tasks = await Task.find({});
		const projects = await Project.find({});
		tasks.forEach((task) => {
			scheduleTaskEditorsNotifications(task);
		});
		for (const project of projects) {
			await scheduleTeamMemberNotifications(project);
		}
		return 'rescheduling notifications done.';
	})()
		.then((msg) => console.log(msg))
		.catch((e) => console.log(e));
}

module.exports = rescheduleNotifications;
