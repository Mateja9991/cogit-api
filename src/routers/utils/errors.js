function duplicateErrorHandler(err, res) {
	const statusCode = 409;
	const field = Object.keys(err.keyValue);
	const message = `User with that ${field} already exists.`;
	res.status(statusCode).send({ error: message, field });
}

function validationErrorHandler(err, res) {
	const statusCode = 422;
	const errors = Object.values(err.errors).map((err) => err.message);
	const fields = Object.values(err.errors).map((err) => err.path);
	res.status(statusCode).send({ error: errors, fields });
}

function errorHandler(err, req, res, next) {
	try {
		if (err.name === 'ValidationError')
			return (err = validationErrorHandler(err, res));
		if (err.code && err.code == 11000)
			return (err = duplicateErrorHandler(err, res));
		else if (res.status < 400) res.status(400);
		return res.send({ error: err.message });
	} catch (err) {
		res.status(500).send({ error: 'Unknown Error.' });
	}
}
module.exports = {
	errorHandler,
};
