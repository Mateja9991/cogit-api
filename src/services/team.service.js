const Team = require('../db/models/team.model');
const User = require('../db/models/user.model');
const { deleteSingleProjectHandler } = require('./project.service');
const {
	duplicateHandler,
	optionsBuilder,
	queryHandler,
	matchBuilder,
} = require('./utils/services.utils');
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
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		console.log(match.name);
		await req.user
			.populate({
				path: 'teams',
				match,
				options,
			})
			.execPopulate();
		res.send(req.user.teams);
	} catch (e) {
		res.status(400).send({ error: e.message });
	}
}

async function getLeaderTeamsHandler(req, res) {
	try {
		await req.user.populate('teams').execPopulate();
		const allLeaderTeams = req.user.teams.filter((item) =>
			item.leaderId.equals(req.user._id)
		);
		const requestedTeams = queryHandler(allLeaderTeams, req.query);
		res.send(requestedTeams);
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

async function getMembersHandler(req, res) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.quert.sortValue
		);
		const requestedMembers = await User.find(
			{
				teams: req.team._id,
			},
			'username email -_id',
			options
		);

		res.send(requestedMembers);
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
		for (project of team.projects) {
			await deleteSingleProjectHandler(project);
		}
	}
	const users = await User.find({
		teams: team._id,
	});
	console.log(users);
	for (const user of users) {
		user.teams.splice(user.teams.indexOf(team._id), 1);
		await user.save();
	}
	console.log(team);
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
	getMembersHandler,
};
