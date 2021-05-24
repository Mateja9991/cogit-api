const { jwtAuthMiddleware } = require('./jwt_authorization_middleware');
const { ownershipAuthMiddleware } = require('./ownership_auth_middleware');
const { teamMemberAuth, teamLeaderAuth } = require('./team.authorization.js');
const {
	projectToLeaderAuth,
	projectToMemberAuth,
} = require('./project.authorization.js');
const {
	listToLeaderAuth,
	listToMemberAuth,
} = require('./list.authorization.js');
const {
	taskToLeaderAuth,
	taskToMemberAuth,
	assignAuth,
} = require('./task.authorization.js');
const {
	commentToLeaderAuth,
	commentToMemberAuth,
} = require('./comment.authorization.js');
const { adminAuth } = require('./admin.authorization.js');
const { noteToLeaderAuth } = require('./note.authorization');
module.exports = {
	jwtAuthMiddleware,
	ownershipAuthMiddleware,
	teamMemberAuth,
	teamLeaderAuth,
	projectToLeaderAuth,
	projectToMemberAuth,
	listToLeaderAuth,
	listToMemberAuth,
	taskToLeaderAuth,
	taskToMemberAuth,
	assignAuth,
	commentToLeaderAuth,
	commentToMemberAuth,
	adminAuth,
	noteToLeaderAuth,
};
