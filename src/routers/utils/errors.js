const models = require('../../db/models/');

async function duplicateErrorHandler(err, res) {
	const statusCode = 409;
	const fields = Object.keys(err.keyValue);
	Object.keys(err).forEach((key) => console.log(key, ': ', err[key]));

	let message = '';
	let model = '';
	let document;
	for (const field of fields) {
		if (field.includes('Id')) {
			let lowercase = field.replace('Id', '');
			model = lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
			if (model === 'Leader') model = 'User';
			console.log(model);
			document = await models[model].findById(err.keyValue[field]);
			console.log(document);
		}
	}
	if (document && (document.name || document.username)) {
		if (model !== 'Project')
			message = `${model} '${
				document.name || document.username
			}' alredy has instance with name '${err.keyValue['name']}.'`;
		else message = `${err.keyValue['name']} name taken.`;
	} else {
		message = `Instance with that ${fields} alredy exists.`;
	}
	res.status(statusCode).send({ error: message, fields });
}

function validationErrorHandler(err, res) {
	const statusCode = 422;
	const errors = Object.values(err.errors).map((err) => err.message);
	const fields = Object.values(err.errors).map((err) => err.path);
	res.status(statusCode).send({ error: errors, fields });
}

async function errorHandler(err, req, res, next) {
	try {
		console.log(err);
		if (err.name === 'ValidationError')
			return (err = validationErrorHandler(err, res));
		if (err.code && err.code == 11000)
			return (err = await duplicateErrorHandler(err, res));
		else if (res.statusCode < 400) res.status(400);
		return res.send({ error: err.message });
	} catch (err) {
		res.status(500).send({ error: 'Unknown Error.' });
	}
}
module.exports = {
	errorHandler,
};
