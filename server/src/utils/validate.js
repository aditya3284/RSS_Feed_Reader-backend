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

const validateRegistorRequest = (value) => {
return registerRequestSchema.validate(value, { abortEarly: false });
};

const validateLoginRequest =  (value) => {
 return loginRequestSchema.validate(value, { abortEarly: false });
};
export { validateRegistorRequest, validateLoginRequest };
