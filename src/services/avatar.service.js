const sharp = require('sharp');
const { Avatar } = require('../db/models');
const { destructureObject } = require('./utils/services.utils');
const { MODEL_PROPERTIES } = require('../constants');
const selectFields = MODEL_PROPERTIES.AVATAR.SELECT_FIELDS;
const allowedKeys = MODEL_PROPERTIES.AVATAR.ALLOWED_KEYS;

async function uploadAvatarHandler(req, res, next) {
	try {
		const avatarObject = destructureObject(req.body, allowedKeys.CREATE);
		const avatarBuffer = await sharp(req.file.buffer)
			.resize({ width: 150, height: 150 })
			.png()
			.toBuffer();
		const base64 = Avatar.generateBase64(avatarBuffer);
		const newAvatar = new Avatar({
			...avatarObject,
			picture: base64,
		});
		await newAvatar.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function getAllAvatarsHandler(req, res, next) {
	try {
		const availableAvatars = await Avatar.find({}, selectFields).lean();
		res.send(availableAvatars);
	} catch (e) {
		next(e);
	}
}

async function getOneAvatarHandler(req, res, next) {
	try {
		const avatar = await Avatar.findById(req.params.avatarId);
		// res.set('Content-Type', 'image/png');
		res.send(avatar);
	} catch (e) {
		next(e);
	}
}

async function deleteAvatarHandler(req, res, next) {
	try {
		await Avatar.findOneAndDelete({ _id: req.params.avatarId });
		res.send({ message: 'success' });
	} catch (e) {
		next(e);
	}
}

module.exports = {
	uploadAvatarHandler,
	getAllAvatarsHandler,
	getOneAvatarHandler,
	deleteAvatarHandler,
};
