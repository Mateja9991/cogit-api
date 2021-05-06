const express = require('express');
const router = new express.Router();

router.use(function (req, res, next) {
	res.header('Access-Control-Allow-Headers', '*');
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', '*');
	next();
});

router.use(require('./user.router'));
router.use(require('./task.router'));
router.use(require('./list.router'));
router.use(require('./project.router'));
router.use(require('./team.router'));
router.use(require('./calendar.router'));
router.use(require('./message.router'));
router.use(require('./comment.router'));
router.use(require('./session.router'));
router.use(require('./user.router'));
router.use(require('./avatar.router'));

module.exports = router;
