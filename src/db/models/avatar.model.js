const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const avatarSchema = new Schema({
	name: {
		type: String,
		unique: true,
		required: true,
		trim: true,
	},
	picture: {
		type: Buffer,
		required: true,
	},
	isDefault: {
		type: Boolean,
		default: false,
	},
});
//
//
//
avatarSchema.statics.getDefaultAvatar = async function () {
	const defaultAvatar = await Avatar.findOne({ isDefault: true });
	return defaultAvatar;
};

avatarSchema.methods.generateBase64 = function () {
	var binary = '';
	var bytes = new Uint8Array(this.picture);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Buffer.from(binary, 'binary').toString('base64');
};

avatarSchema.methods.toJSON = function () {
	const avatar = this;
	const avatarObject = avatar.toObject();

	delete avatarObject.picture;
	avatarObject.picture = this.generateBase64();

	return avatarObject;
};

const Avatar = model(MODEL_PROPERTIES.AVATAR.NAME, avatarSchema);

module.exports = Avatar;
