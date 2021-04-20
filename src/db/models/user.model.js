const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MODEL_NAMES } = require('../../constants/model_names');
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
		},
		tag: {
			type: String,
			required: true,
			unique: true,
			maxlength: [10, 'No space.'],
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
					default: Date.now(),
				},
			},
		],
		avatar: {
			type: Buffer,
		},
		settings: [
			{
				theme: {
					type: String,
					required: true,
				},
				taskView: {
					type: String,
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
						_id: {
							type: ObjectId,
							required: true,
						},
						eventType: {
							type: String,
							enum: ['invitation', 'assignment', 'message'],
							required: true,
						},
					},
				},
				receivedAt: {
					type: Date,
					default: Date.now(),
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
//              Virtuals
//
// userSchema.virtual('messages', {
// 	ref: MODEL_NAMES.MESSAGE,
// 	localField: '_id',
// 	foreignField: 'sentTo',
// });

// userSchema.virtual('newMessages', {
// 	ref: MODEL_NAMES.MESSAGE,
// 	localField: '_id',
// 	foreignField: 'sentTo',
// 	match: { seen: false },
// });

// userSchema.virtual('seenMessages', {
// 	ref: MODEL_NAMES.MESSAGE,
// 	localField: '_id',
// 	foreignField: 'sentTo',
// 	match: { seen: true },
// });

// userSchema.virtual('sentMessages', {
// 	ref: MODEL_NAMES.MESSAGE,
// 	localField: '_id',
// 	foreignField: 'from',
// });
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
userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });
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

	let tag = lastTag + 1;
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

	delete userObject.password;
	delete userObject.tokens;

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
