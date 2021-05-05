const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
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

const Avatar = model(MODEL_NAMES.AVATAR, avatarSchema);

module.exports = Avatar;
