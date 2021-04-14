const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MODEL_NAMES } = require('../../constants/model_names');
//
//              Schema
//
const userSchema = new Schema({
	username: {
		type: String,
		required: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: [7, 'Password too short (<7).'],
	},
	lastActiveAt: Date,
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
	notifications: [{}],
});
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
userSchema.statics.findByCredentials = async (username, password) => {
	const admin = await Admin.findOne({ username });
	if (!admin) {
		throw new Error('Unable to login.');
	}
	if (!(await bcrypt.compare(password, admin.password))) {
		throw new Error('Unable to login.');
	}
	return user;
};
//
//              Document methods
//
adminSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;

	return userObject;
};

adminSchema.methods.generateAuthToken = async function () {
	const admin = this;
	const token = jwt.sign({ _id: admin._id.toString() }, process.env.TOKEN_KEY, {
		expiresIn: '7 days',
	});
	return token;
};
//
//
//
const Admin = model(MODEL_NAMES.ADMIN, adminSchema);

module.exports = User;
