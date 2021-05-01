const { Schema, model } = require('mongoose');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const avatarModel = new Schema({
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
});
//
//
//
const Avatar = model(MODEL_NAMES.AVATAR, avatarModel);

module.exports = Avatar;
