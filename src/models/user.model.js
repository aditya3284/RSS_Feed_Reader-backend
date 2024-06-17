import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Schema, model } from 'mongoose';
import { allowedImageFormats, emailRegex } from '../constants.js';

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
			select: true,
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
		fullName: {
			type: String,
			default: 'New User',
			trim: true,
		},
		gender: {
			type: String,
			enum: {
				values: ['Male', 'Female', 'Other', 'I prefer not to share'],
				message: `{VALUE} is not supported`,
			},
			default: 'Other',
			select: false,
		},
		dateOfBirth: {
			type: Date,
			default: '2000-12-25',
			select: false,
		},
		age: {
			type: Number,
			min: 5,
			max: 125,
			select: false,
		},
		profilePicture: {
			image_id: {
				type: String,
				select: true,
				default: null,
			},
			format: {
				type: String,
				enum: {
					values: allowedImageFormats,
					message: `{VALUE} is not supported`,
				},
				select: true,
				default: null,
			},
			URL: {
				type: String,
				trim: true,
				select: true,
				default: null,
			},
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
		likedFeedItems: [
			{
				type: Schema.Types.ObjectId,
				ref: 'feedItem',
				default: undefined,
				select: false,
			},
		],
		likedFeeds: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Feed',
				default: undefined,
				select: false,
			},
		],
		allFeeds: [
			{
				feedID: {
					type: Schema.Types.ObjectId,
					ref: 'Feed',
					default: undefined,
				},
				url: {
					type: String,
					trim: true,
					default: undefined,
				},
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

userSchema.method('generateAccessToken', async function () {
	return jwt.sign({ Uid: this._id }, process.env.ACCESS_TOKEN_JWT_SECRET, {
		algorithm: process.env.ACCESS_TOKEN_JWT_ALGORITHM,
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
	});
});

userSchema.method('generateRefreshToken', async function () {
	return jwt.sign({ userID: this.id }, process.env.REFRESH_TOKEN_JWT_SECRET, {
		algorithm: process.env.REFRESH_TOKEN_JWT_ALGORITHM,
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});
});

export const User = model('User', userSchema);
