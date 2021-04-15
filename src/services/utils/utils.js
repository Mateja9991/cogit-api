async function duplicateHandler(model, parentPropertyPath, parentId, child) {
	const isDuplicate = await model.findOne({
		[parentPropertyPath]: parentId,
		...child,
	});
	if (isDuplicate) {
		throw new Error('There is already the same instance');
	}
}
//		await duplicateHandler(Project, 'teamId', req.team._id, req.body);
module.exports = {
	duplicateHandler,
};
