const Team = require('../db/models/team.model');
const { deleteProjectHandler } = require('./project.service');
const { duplicateHandler } = require('./utils/utils');
//
//				ROUTER HANDLERS
//
async function createTeamHandler(req, res) {
	try {
		await req.user.populate('teams').execPopulate();
		await duplicateHandler(Team, 'leaderId', req.user._id, req.body);
		const team = new Team({
			...req.body,
			leaderId: req.user._id,
		});
		await team.save();
		req.user.teams.push(team._id);
		console.log(req.user.teams);
		await req.user.save();
		res.send(team);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getAllUserTeamsHandler(req, res) {
	try {
		await req.user.populate('teams').execPopulate();
		res.send(req.user.teams);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getLeaderTeamsHandler(req, res) {
	try {
		console.log(req.user);
		await req.user.populate('teams').execPopulate();
		console.log(req.user.teams);
		const teams = req.user.teams.filter((item) =>
			item.leaderId.equals(req.user._id)
		);
		res.send(teams);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getTeamHandler(req, res) {
	try {
		res.send(req.team);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}
async function updateTeamHandler(req, res) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name', 'leaderId'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			throw new Error('Invalid update fields');
		}
		await duplicateHandler(Team, 'leaderId', req.user._id, req.body);
		updates.forEach((update) => {
			req.team[update] = req.body[update];
		});
		await req.team.save();
		res.send(req.team);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteTeamHandler(req, res) {
	try {
		await deleteSingleTeamHandler(req.team);
		res.send({
			success: true,
		});
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function deleteSingleTeamHandler(team) {
	await team.populate('projects').execPopulate();
	if (team.projects.length) {
		await Promise.all(
			team.projects.forEach(async (project) => {
				await deleteSingleProjectHandler(project);
			})
		);
	}
	const users = await User.find({
		teams: { $elemMatch: team._id },
	});
	await Promise.all(
		users.forEach(async (user) => {
			user.teams.splice(user.teams.findIndex(team._id), 1);
			await user.save();
		})
	);

	await team.remove();
}
module.exports = {
	createTeamHandler,
	getAllUserTeamsHandler,
	getLeaderTeamsHandler,
	getTeamHandler,
	updateTeamHandler,
	deleteTeamHandler,
	deleteSingleTeamHandler,
};
