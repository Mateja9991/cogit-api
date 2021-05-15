const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Avatar = require('./avatar.model');
const Session = require('./session.model');
const Message = require('./message.model');
const { MODEL_PROPERTIES, TIME_VALUES } = require('../../constants');
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
			trim: true,
			minlength: [7, 'Password too short (<7).'],
		},
		active: { type: Boolean, default: false },
		lastActiveAt: Date,
		resetToken: {
			key: { type: String },
			expiresIn: {
				type: Date,
			},
		},
		teams: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_PROPERTIES.TEAM.NAME,
			},
		],
		visits: [
			{
				teamId: {
					type: Schema.Types.ObjectId,
				},
				date: {
					type: Date,
					required: true,
				},
			},
		],
		contacts: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: MODEL_PROPERTIES.USER.NAME,
			},
		],
		invitations: [
			{
				teamId: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: MODEL_PROPERTIES.TEAM.NAME,
				},
				receivedAt: {
					type: Date,
					required: true,
				},
			},
		],
		avatar: {
			type: Schema.Types.ObjectId,
			ref: MODEL_PROPERTIES.AVATAR.NAME,
		},
		settings: {
			theme: {
				type: String,
				enum: ['dark', 'light'],
				default: 'dark',
			},
			projectView: [
				{
					reference: {
						type: Schema.Types.ObjectId,
						ref: MODEL_PROPERTIES.PROJECT.NAME,
						required: true,
					},
					view: {
						type: String,
						enum: ['list', 'board'],
						required: true,
					},
				},
			],
			defaultView: {
				type: String,
				enum: ['list', 'board'],
				default: 'list',
			},
		},

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
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
//
//              Middleware
//
//  Hash plaintext password before saving
userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 8);
	}
	if (this.isModified('resetToken') && this.resetToken) {
		this.resetToken.key = await bcrypt.hash(this.resetToken.key, 8);
	}
	if (!this.avatar) {
		const defaultAvatar = await Avatar.getDefaultAvatar();
		if (!defaultAvatar) {
			const count = await Avatar.countDocuments();
			const skip = Math.floor(Math.random() * count);
			this.avatar = await Avatar.findOne({}).skip(skip);
			console.log('NO DEFAULT');
		} else {
			this.avatar = defaultAvatar;
		}
	}
	await this.settings.populate('projectView.reference').execPopulate();
	for (const projectView of this.settings.projectView) {
		if (!this.teams.includes(projectView.reference.teamId))
			throw new Error('Invalid projectId');
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

	delete userObject.password;
	delete userObject.notifications;
	delete userObject.invitations;
	delete userObject.role;
	delete userObject.teams;
	delete userObject.resetToken;
	delete userObject.createdAt;
	delete userObject.updatedAt;
	delete userObject.__v;

	return userObject;
};

userSchema.methods.updateContacts = async function (sendEvent, event, msg) {
	const user = this;
	await user.populate('contacts').execPopulate();
	for (const contact of user.contacts) {
		const updatedContacts = await contact.generateContactList();
		sendEvent(contact._id, event, { updatedContacts, msg }, 'users');
	}
};

userSchema.methods.generateBase64 = async function () {
	await this.populate('avatar').execPopulate();
	var binary = '';
	var bytes = new Uint8Array(this.avatar.picture);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Buffer.from(binary, 'binary').toString('base64');
};

userSchema.methods.generateContactList = async function () {
	const user = this;
	await user
		.populate({
			path: 'contacts',
			model: MODEL_PROPERTIES.USER.NAME,
			options: {
				sort: { active: -1 },
			},
		})
		.execPopulate();
	const contactList = user.contacts;

	let index = contactList.findIndex((item) => item.active === false);
	console.log('index', index);

	if (index === -1) index = contactList.length;
	const comparableArr = await Promise.all(
		contactList.map(async (contact) => {
			let session = await Session.findOne({
				$and: [
					{ participants: { $elemMatch: { userId: user._id } } },
					{ participants: { $elemMatch: { userId: contact._id } } },
				],
			}).lean();
			let messages = await Message.find({ sessionId: session._id }).lean();
			return { numOfMessages: messages.length, contact };
		})
	);

	const activeContacts = comparableArr.slice(0, index);
	const offlineContacts = comparableArr.slice(index);

	let result = [];
	const sortingFunction = (a, b) =>
		a.numOfMessages < b.numOfMessages ? 1 : -1;
	activeContacts.sort(sortingFunction);
	offlineContacts.sort(sortingFunction);
	const activeResult = activeContacts.map((item) => item.contact);
	const offlineResult = offlineContacts.map((item) => item.contact);
	result = result.concat(activeResult);
	result = result.concat(offlineResult);
	// let i = 0;
	// let subArray;
	// let result = [];
	// while (i < contactList.length) {
	// 	subArray = contactList.filter(
	// 		(contact) => contact['active'] === contactList[i]['active']
	// 	);
	// 	subArray.sort((a, b) => {
	// 		return a.receivedAt.getTime() < b.receivedAt.getTime() ? 1 : -1;
	// 	});
	// 	i += subArray.length;
	// 	result = result.concat(subArray);
	// }

	return result;
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
const User = model(MODEL_PROPERTIES.USER.NAME, userSchema);

module.exports = User;
