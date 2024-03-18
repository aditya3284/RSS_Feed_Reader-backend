import { Schema, model } from 'mongoose';
import { emailRegex } from '../constants.js';
import bcrypt from 'bcrypt';

const nameSchema = new Schema({
	firstName: {
		type: String,
		required: [true, 'first name is required'],
		minLength: [2, 'first name must be at least 2 characters, got {VALUE}'],
		trim: true,
	},
	middleName: {
		type: String,
		trim: true,
	},
	lastName: {
		type: String,
		required: [true, 'last name is required'],
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
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			match: [emailRegex, 'expects a valid email address, got {VALUE}'],
		},
		fullName: { nameSchema },
		gender: {
			type: String,
			enum: {
				values: ['Male', 'Female', 'Other', 'I prefer not to share'],
				message: `{VALUE} is not supported`,
			},
			default: 'I prefer not to share',
		},
		age: {
			type: Number,
			min: 5,
			max: 125,
			required: [true, 'age is required'],
		},
		profilePicture: {
			type: String,
		},
		coverImage: {
			type: String,
		},
		password: {
			type: String,
			required: [true, 'password is required'],
		},
		verified: {
			type: Boolean,
			default: false,
		},
		watchHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'YT_Video',
				default: undefined,
			},
		],
		readHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Feed_Item',
				default: undefined,
			},
		],
		refreshToken: {
			type: String,
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

export const User = model('User', userSchema);
