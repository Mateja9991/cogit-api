const { User, Team } = require('../db/models');
const { deleteSingleProjectHandler } = require('./project.service');
const { newSessionHandler } = require('./session.service');
const {
	duplicateHandler,
	optionsBuilder,
	queryHandler,
	matchBuilder,
	destructureObject,
} = require('./utils/services.utils');
//
//				ROUTER HANDLERS
//

const { MODEL_PROPERTIES } = require('../constants');
const { isUndefined } = require('lodash');
const selectFields = MODEL_PROPERTIES.TASK.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.TASK.ALLOWED_KEYS;

async function createTeamHandler(req, res, next) {
	try {
		await req.user.populate('teams').execPopulate();
		// await duplicateHandler(Team, 'leaderId', req.user._id, req.body);
		const teamObject = destructureObject(req.body, allowedKeys.CREATE);
		const team = new Team({
			...teamObject,
			leaderId: req.user._id,
		});
		await team.save();
		req.user.teams.push(team._id);
		await req.user.save();
		newSessionHandler(undefined, team._id);
		res.send(team);
	} catch (e) {
		next(e);
	}
}

async function getAllUserTeamsHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		await req.user
			.populate({
				path: 'teams',
				match,
				options,
			})
			.execPopulate();
		res.send(await sortUserTeams(req.user));
	} catch (e) {
		next(e);
	}
}

async function getLeaderTeamsHandler(req, res, next) {
	try {
		let allLeaderTeams;
		await req.user.populate('teams').execPopulate();
		if (req.query.sortBy) {
			allLeaderTeams = req.user.teams.filter((item) =>
				item.leaderId.equals(req.user._id)
			);
		} else {
			const sortedTeams = await sortUserTeams(req.user);
			allLeaderTeams = sortedTeams.filter((item) =>
				item.leaderId.equals(req.user._id)
			);
		}
		const requestedTeams = queryHandler(
			allLeaderTeams,
			req.query,
			selectFields
		);
		res.send(requestedTeams);
	} catch (e) {
		next(e);
	}
}

async function sortUserTeams(user) {
	const teams = user.teams;
	const tmp = teams.map((team) => {
		const numberOfVisits = user.visits.filter((vis) =>
			vis.teamId.equals(team._id)
		).length;
		console.log(numberOfVisits);
		return {
			team,
			numberOfVisits,
		};
	});
	tmp.sort((a, b) => {
		if (a.numberOfVisits < b.numberOfVisits) return 1;
		return -1;
	});
	console.log(tmp.map((vis) => vis.numberOfVisits));
	return tmp.map((vis) => vis.team);
}

async function getTeamHandler(req, res, next) {
	try {
		console.log(req.user.visits.length);
		if (req.user.visits.length >= 8) {
			const searchDate = req.user.visits.reduce((date, visit) => {
				if (date > visit.date.getTime()) date = visit.date.getTime();
				return date;
			}, Date.now());
			console.log(searchDate);
			req.user.visits = req.user.visits.filter(
				(visit) => !(visit.date.getTime() === searchDate)
			);
		}
		req.user.visits.push({
			teamId: req.team._id,
			date: Date.now(),
		});
		await req.user.save();
		await req.team.save();
		await req.team.populate('projects').execPopulate();
		return res.send(req.team);
	} catch (e) {
		next(e);
	}
}

async function getMembersHandler(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		const requestedMembers = await User.find(
			{
				teams: req.team._id,
				...match,
			},
			selectFields,
			options
		).lean();

		res.send(requestedMembers);
	} catch (e) {
		next(e);
	}
}

async function getAllTeams(req, res, next) {
	try {
		const options = optionsBuilder(
			req.query.limit,
			req.query.skip,
			req.query.sortBy,
			req.query.sortValue
		);
		const match = matchBuilder(req.query);
		const requestedTeams = await Team.find(
			{
				...match,
			},
			selectFields,
			options
		).lean();

		res.send(requestedTeams);
	} catch (e) {
		next(e);
	}
}

async function updateTeamHandler(req, res, next) {
	const updates = Object.keys(req.body);
	const allowedToUpdate = ['name', 'leaderId'];
	const isValidUpdate = updates.every((update) =>
		allowedToUpdate.includes(update)
	);

	try {
		if (!isValidUpdate) {
			res.status(422);
			throw new Error('Invalid update fields');
		}
		// await duplicateHandler(Team, 'leaderId', req.user._id, req.body);
		updates.forEach((update) => {
			req.team[update] = req.body[update];
		});
		await req.team.save();
		res.send(req.team);
	} catch (e) {
		next(e);
	}
}

async function deleteTeamHandler(req, res, next) {
	try {
		await deleteSingleTeamHandler(req.team);
		res.send({
			success: true,
		});
	} catch (e) {
		next(e);
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
	console.log(users);
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
	getAllTeams,
};
