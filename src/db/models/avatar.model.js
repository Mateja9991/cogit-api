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

const Avatar = model(MODEL_PROPERTIES.AVATAR.NAME, avatarSchema);

module.exports = Avatar;
