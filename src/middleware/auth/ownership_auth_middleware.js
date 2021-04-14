const lodash = require('lodash');

function ownershipAuthMiddleware(
	parentModel, // Task
	parentIdPropertyPath, // taskId
	requestSaveInProperty, // task
	childIdentifierProperty, // editors
	childIdProrpertyPath, //
	toMany
) {
	return async (req, res, next) => {
		if (req[requestSaveInProperty]) {
			next();
		}
		try {
			const parentId = lodash.get(req, parentIdPropertyPath);
			const childId = lodash.get(req, childIdProrpertyPath);
			const findQuery = {
				_id: parentId,
			};
			if (!req.admin) {
				findQuery[childIdentifierProperty] = toMany
					? { $elemMatch: childId }
					: childId;
			}
			const model = await parentModel.findOne(findQuery);

			if (!model) {
				throw new Error("You don't have permission to access this model");
			}

			req[requestSaveInProperty] = model;
			next();
		} catch (e) {
			res.status(401).send({
				error: 'Please Authenticate	',
			});
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
