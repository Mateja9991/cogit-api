const sharp = require('sharp');
const { Avatar } = require('../db/models');
async function uploadAvatarHandler(req, res, next) {
	try {
		const avatarBuffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		const newAvatar = new Avatar({
			name: req.body.name,
			picture: avatarBuffer,
		});
		await newAvatar.save();
		res.send({ success: true });
	} catch (e) {
		next(e);
	}
}

async function getAllAvatarsHandler(req, res, next) {
	try {
		const availableAvatars = await Avatar.find({}, '_id').lean();
		res.send(availableAvatars);
	} catch (e) {
		next(e);
	}
}

async function getOneAvatarHandler(req, res, next) {
	try {
		const avatar = await Avatar.findById(req.params.avatarId);
		res.set('Content-Type', 'image/png');
		res.send(avatar.picture);
	} catch (e) {
		next(e);
	}
}

async function setDefaultAvatarHandler(req, res, next) {
	try {
		const newDefault = await Avatar.findById(req.params.avatarId);
		if (!newDefault) {
			res.status(404);
			throw new Error('Avatar not found.');
		}
		const allAvatars = await Avatar.find({});
		for (const avatar of allAvatars) {
			if (avatar.isDefault) {
				avatar.isDefault = false;
				await avatar.save();
			}
		}
		newDefault.isDefault = true;
		await newDefault.save();
		res.send({ success: true });
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
	setDefaultAvatarHandler,
	deleteAvatarHandler,
};
