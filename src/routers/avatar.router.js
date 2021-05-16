const express = require('express');
const upload = require('multer')({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, callback) {
		if (file.originalname.match(/\.(jpeg|jpg|png)$/)) {
			callback(undefined, true);
		} else {
			callback(new Error('Please upload image (png, jpg,)'));
		}
	},
});

const { jwtAuthMiddleware, adminAuth } = require('../middleware/auth');
const {
	uploadAvatarHandler,
	getAllAvatarsHandler,
	getOneAvatarHandler,
	deleteAvatarHandler,
} = require('../services/avatar.service');

const router = new express.Router();
//
//              ROUTES
//
router.post(
	'/avatars',
	jwtAuthMiddleware,
	upload.single('upload'),
	uploadAvatarHandler
);

router.get('/avatars', jwtAuthMiddleware, getAllAvatarsHandler);

router.get('/avatars/:avatarId', jwtAuthMiddleware, getOneAvatarHandler);

router.delete('/avatars/:avatarId', jwtAuthMiddleware, deleteAvatarHandler);

module.exports = router;
