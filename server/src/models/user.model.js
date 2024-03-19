import { Schema, model } from 'mongoose';
import { emailRegex } from '../constants.js';
import bcrypt from 'bcrypt';

const nameSchema = new Schema({
	firstName: {
		type: String,
		minLength: [2, 'first name must be at least 2 characters, got {VALUE}'],
		trim: true,
	},
	middleName: {
		type: String,
		trim: true,
	},
	lastName: {
		type: String,
		minLength: [2, 'last name must be at least 2 characters, got {VALUE}'],
	},
});

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: [true, 'username is required'],
			index: true,
			trim: true,
			unique: [true, 'username must be unique'],
			lowercase: true,
			minLength: [1, 'username must be at least 1 character, got {VALUE}'],
			maxLength: [
				32,
				"username can't exceed length of 32 characters, got {VALUE}",
			],
		},
		email: {
			type: String,
			required: [true, 'email address is required'],
			unique: [true, 'email address must be unique'],
			trim: true,
			lowercase: true,
			match: [emailRegex, 'expects a valid email address, got {VALUE}'],
			select: true,
		},
		fullName: { nameSchema },
		gender: {
			type: String,
			enum: {
				values: ['Male', 'Female', 'Other', 'I prefer not to share'],
				message: `{VALUE} is not supported`,
			},
			default: 'I prefer not to share',
			select: false,
		},
		age: {
			type: Number,
			min: 5,
			max: 125,
			select: false,
		},
		profilePicture: {
			type: String,
			select: false,
		},
		coverImage: {
			type: String,
			select: false,
		},
		password: {
			type: String,
			required: [true, 'password is required'],
			select: false,
		},
		verified: {
			type: Boolean,
			default: false,
			select: false,
		},
		watchHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'YT_Video',
				default: undefined,
				select: false,
			},
		],
		readHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Feed_Item',
				default: undefined,
				select: false,
			},
		],
		refreshToken: {
			type: String,
			select: false,
		},
	},
	{ timestamps: true, minimize: true }
);

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		this.password = await bcrypt.hash(this.password, 10);
	} catch (error) {
		next(error);
	}

	next();
});

userSchema.method('validatePasswordFromDb', async function (plainTextPassword) {
	return await bcrypt.compare(plainTextPassword, this.password);
});

export const User = model('User', userSchema);
