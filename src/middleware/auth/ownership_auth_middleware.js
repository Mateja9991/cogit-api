const lodash = require('lodash');

function ownershipAuthMiddleware(
	parentModel,
	parentIdPropertyPath,
	requestSaveInProperty,
	childIdentifierProperty,
	childIdProrpertyPath
) {
	return async (req, res, next) => {
		try {
			if (req[requestSaveInProperty]) {
				next();
			}
			const parentId = lodash.get(req, parentIdPropertyPath);
			const childId = lodash.get(req, childIdProrpertyPath);
			const findQuery = {
				_id: parentId,
			};
			const searchedModel = await parentModel.findOne(findQuery);
			if (!req.admin) {
				findQuery[childIdentifierProperty] = childId;
			}
			const model = await parentModel.findOne(findQuery);
			if (!searchedModel) {
				res.status(404);
				throw new Error('Dcoument not found.');
			}
			if (!model) {
				res.status(403);
				throw new Error('You dont have permission to access this document.');
			}
			req[requestSaveInProperty] = model;
			next();
		} catch (e) {
			next(e);
		}
	};
}

module.exports = {
	ownershipAuthMiddleware,
};
// function ownershipAuthMiddleware(
// 	parentModel,
// 	parentIdPropertyPath, // gde se nalazi id model koj ocu da nadjem
// 	requestSaveInProperty,
// 	childIdentifierProperty,
// 	childIdProrpertyPath,
// 	parentIdBearer,
// 	childIdBearer
// ) {
// 	return async (req, res, next) => {
// 		try {
// 			const parentId = lodash.get(
// 				parentIdBearer ? parentIdBearer : req,
// 				parentIdPropertyPath
// 			);
// 			const childId = lodash.get(
// 				childIdBearer ? childIdBearer : req,
// 				childIdProrpertyPath
// 			);
// 			const findQuery = {
// 				_id: parentId,
// 				[childIdentifierProperty]: childId,
// 			};
// 			const model = await parentModel.findOne(findQuery);

// 			if (!model) {
// 				throw new Error("You don't have permission to access this model");
// 			}

// 			req[requestSaveInProperty] = model;
// 			next();
// 		} catch (e) {
// 			res.status(401).send({
// 				error: 'Please Authenticate	',
// 			});
// 		}
// 	};
// }
