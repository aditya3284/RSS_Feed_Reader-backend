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
		.pattern(emailRegex, { name: 'E-mail' }),
	password: Joi.string().alphanum().min(8).max(48).required(),
});

const changeUserPasswordSchema = Joi.object({
	oldPassword: Joi.string().alphanum().min(8).max(48).required(),
	newPassword: Joi.string().alphanum().min(8).max(48).required(),
});

const userProfileDetailsSchema = Joi.object({
	fullName: Joi.object({
		firstName: Joi.string().trim(true).min(2).max(24),
		middleName: Joi.string().trim(true).min(1).max(24),
		lastName: Joi.string().trim(true).min(2).max(24),
	}).max(3),
	gender: Joi.string()
		.trim(true)
		.valid('Male', 'Female', 'Other', 'I prefer not to share'),
	age: Joi.number().integer().min(5).max(125).positive(),
});

const feedInfoSchema = Joi.object({
	name: Joi.string().trim(true),
	iconUrl: Joi.string().trim(true),
	textDirection: Joi.string().valid('ltr', 'rtl').trim(true),
	favorite: Joi.boolean(),
});

const feedURLSchema = Joi.object({ feedURL: Joi.string().trim(true) });

const feedItemInfoSchema = Joi.object({ hasRead: Joi.boolean() });

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

const validateFeedURL = (value) => {
	return feedURLSchema.validate(value, { abortEarly: false });
};

const validateFeedItemInfo = (value) => {
	return feedItemInfoSchema.validate(value, { abortEarly: false });
};

export {
	validateFeedInfo,
	validateFeedItemInfo,
	validateLoginRequest,
	validateRegistorRequest,
	validateUserPasswordChangeRequest,
	validateUserProfileDetails,
	validateFeedURL,
};
