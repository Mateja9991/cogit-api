const lodash = require('lodash');
async function duplicateHandler(model, parentPropertyPath, parentId, child) {
	const isDuplicate = await model.findOne({
		[parentPropertyPath]: parentId,
		...child,
	});
	if (isDuplicate) {
		throw new Error('There is already the same instance');
	}
}

function optionsBuilder(limit, skip, sortBy, sortValue) {
	let options = {};
	if (limit) {
		options.limit = Number(limit);
	}
	if (skip) {
		options.skip = Number(skip);
	}
	if (sortBy) {
		options.sort = {
			[sortBy]: sortValue ? Number(sortValue) : -1,
		};
	}
	console.log(limit, options);
	return options;
}

function matchBuilder(query) {
	const matchObject = query;
	delete matchObject.limit;
	delete matchObject.skip;
	delete matchObject.sortBy;
	delete matchObject.sortValue;
	return {
		...matchObject,
	};
}

function queryHandler(allItems, query) {
	const sortBy = query.sortBy;
	const sortValue = query.sortValue ? query.sortValue : 1;
	const skip = query.skip ? query.skip : 0;
	const offset = query.limit ? query.limit : allItems.length - skip;
	const match = matchBuilder(query);
	const matchKeys = Object.keys(match);

	let requestedItems = allItems.filter(
		(item) =>
			matchKeys.length ===
			matchKeys.filter((key) => lodash.get(item, key).toString() === match[key])
				.length
	);

	if (sortBy) {
		allItems.sort((a, b) => {
			let valueA = a[sortBy];
			let valueB = b[sortBy];
			if (typeof valueA === 'string' || valueA instanceof String) {
				valueA = valueA.toUpperCase();
				valueB = valueB.toUpperCase();
			}
			if (valueA < valueB) {
				return -1 * sortValue;
			}
			if (valueA > valueB) {
				return 1 * sortValue;
			}
			return 0;
		});
	}

	requestedItems = requestedItems.slice(
		Number(skip),
		Number(skip) + Number(offset)
	);

	return requestedItems;
}

//		await duplicateHandler(Project, 'teamId', req.team._id, req.body);
module.exports = {
	duplicateHandler,
	optionsBuilder,
	queryHandler,
	matchBuilder,
};
