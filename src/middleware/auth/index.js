const { jwtAuthMiddleware } = require('./jwt_authorization_middleware');
const { ownershipAuthMiddleware } = require('./ownership_auth_middleware');
const {
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
} = require('./auth');
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
};
