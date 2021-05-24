const { Schema, model } = require('mongoose');
const { MODEL_PROPERTIES } = require('../../constants');
//
//              Schema
//
const noteSchema = new Schema(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.TEAM.NAME,
		},
		creatorId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: MODEL_PROPERTIES.USER.NAME,
		},
		text: {
			type: String,
			trim: true,
			maxlength: [300, 'Notes maximum length is  300 characters.'],
			required: true,
		},
	},
	{
		timestamps: true,
	}
);
noteSchema.index({ teamId: 1 });
//
//              Virtuals
//

noteSchema.pre('remove', async function () {});
//
//
//
const Note = model(MODEL_PROPERTIES.NOTE.NAME, noteSchema);

module.exports = Note;
