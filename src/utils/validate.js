import Joi from 'joi';
import { emailRegex } from '../constants.js';

const registerRequestSchema = Joi.object({
	username: Joi.string().alphanum().lowercase().min(1).max(32).required(),
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.trim(true)
		.pattern(emailRegex, { name: 'E-mail' }),
	password: Joi.string().alphanum().min(8).max(48).required(),
});

const loginRequestSchema = Joi.object({
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.trim(true)
		.pattern(emailRegex),
	password: Joi.string().alphanum().min(8).max(48).required(),
});

const changeUserPasswordSchema = Joi.object({
	oldPassword: Joi.string().alphanum().min(8).max(48).required(),
	newPassword: Joi.string().alphanum().min(8).max(48).required(),
});

const userProfileDetailsSchema = Joi.object({
	fullName: Joi.string().trim(true).min(2).max(125),
	username: Joi.string().alphanum().lowercase().min(1).max(32),
	email: Joi.string().email().lowercase().trim(true).pattern(emailRegex),
	dateOfBirth: Joi.date(),
	gender: Joi.string()
		.trim(true)
		.valid('Male', 'Female', 'Other', 'I prefer not to share'),
	age: Joi.number().integer().min(5).max(125).positive(),
});

const feedInfoSchema = Joi.object({
	name: Joi.string().trim(true),
	textDirection: Joi.string().valid('ltr', 'rtl').trim(true),
});

const LikedFeedSchema = Joi.object({
	favorite: Joi.boolean().required(),
	url: Joi.string().uri().trim(true),
});

const LikedFeedItemSchema = Joi.object({
	favorite: Joi.boolean().required(),
	url: Joi.string().uri().trim(true),
});

const validateRegistorRequest = (value) => {
	return registerRequestSchema.validate(value, { abortEarly: false });
};

const validateLoginRequest = (value) => {
	return loginRequestSchema.validate(value, { abortEarly: false });
};

const validateUserPasswordChangeRequest = (value) => {
	return changeUserPasswordSchema.validate(value, { abortEarly: false });
};

const validateUserProfileDetails = (value) => {
	return userProfileDetailsSchema.validate(value, { abortEarly: false });
};

const validateFeedInfo = (value) => {
	return feedInfoSchema.validate(value, { abortEarly: false });
};

const validateLikedFeed = (value) => {
	return LikedFeedSchema.validate(value, { abortEarly: true });
};

const validateLikedFeedItem = (value) => {
	return LikedFeedItemSchema.validate(value, { abortEarly: true });
};

export {
	validateFeedInfo,
	validateLikedFeed,
	validateLikedFeedItem,
	validateLoginRequest,
	validateRegistorRequest,
	validateUserPasswordChangeRequest,
	validateUserProfileDetails,
};
