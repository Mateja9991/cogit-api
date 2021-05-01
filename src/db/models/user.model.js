const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MODEL_NAMES } = require('../../constants/model_names');
const { DEFAULT_AVATAR } = require('../../constants/default_avatar');
const { ObjectId } = require('bson');
//
//              Schema
//
const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		role: {
			type: String,
			default: 'user',
			enum: ['user', 'admin'],
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Not an email.');
				}
			},
		},
		password: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			minlength: [7, 'Password too short (<7).'],
		},
		lastActiveAt: Date,
		teams: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_NAMES.TEAM,
			},
		],
		invitations: [
			{
				teamId: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: MODEL_NAMES.TEAM,
				},
				receivedAt: {
					type: Date,
					required: true,
				},
			},
		],
		avatar: {
			type: Schema.Types.ObjectId,
			ref: MODEL_NAMES.AVATAR,
			default: DEFAULT_AVATAR,
		},
		settings: [
			{
				theme: {
					type: String,
					enum: ['dark', 'light'],
					required: true,
				},
				taskView: {
					type: String,
					enum: ['list', 'board'],
					required: true,
				},
			},
		],
		notifications: [
			{
				seen: {
					type: Boolean,
					default: false,
				},
				event: {
					text: {
						type: String,
						required: true,
					},
					reference: {
						type: Schema.Types.ObjectId,
						required: true,
					},
					eventType: {
						type: String,
						enum: [
							'invitation',
							'assignment',
							'message',
							'invitation_accepted',
						],
						required: true,
					},
				},
				receivedAt: {
					type: Date,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

//
//              Middleware
//
//  Hash plaintext password before saving
userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 8);
	}
	next();
});
//
//              Model methods
//
userSchema.statics.findByCredentials = async (tag, password) => {
	let user;
	if (validator.isEmail(tag)) user = await User.findOne({ email: tag });
	else user = await User.findOne({ username: tag });
	if (!user) {
		throw new Error('Unable to login.');
	}
	if (!(await bcrypt.compare(password, user.password))) {
		throw new Error('Unable to login.');
	}
	return user;
};
userSchema.statics.generateTag = async () => {
	const lastTag = await User.countDocuments({});

	let tag = lastTag;
	tag = tag.toString();
	tag = '#' + tag.padStart(9, '0');

	return tag;
};
//
//              Document methods
//
userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();
	delete userObject.avatar;
	delete userObject.password;
	delete userObject.createdAt;
	delete userObject.updatedAt;
	delete userObject.__v;
	delete userObject.notifications;
	delete userObject.invitations;
	delete userObject.role;
	delete userObject.teams;
	return userObject;
};

userSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id.toString() }, process.env.TOKEN_KEY, {
		expiresIn: '7 days',
	});
	return token;
};
//
//
//
const User = model(MODEL_NAMES.USER, userSchema);

module.exports = User;
