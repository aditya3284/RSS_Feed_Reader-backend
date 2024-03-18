import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';
import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import { validateRegistorRequest } from '../utils/validate.js';

const registerUser = async (req, res) => {
	const { error, value } = await validateRegistorRequest(req.body);

	if (error) {
		throw new APIError(400, error);
	}

	const { username, email, password } = value;

	const existingUser = User.find({
		$or: [{ username }, { email }],
	});

	if (existingUser) {
		throw new APIError(400, 'User already exists');
	}

	const user = await User.create({
		username,
		email,
		password,
	});

	const newlyCreatedUser = User.findById(user._id).select(
		'-password -refreshToken -fullName -gender -watchHistory -readHistory -age'
	);

	if (!newlyCreatedUser) {
		throw new APIError(
			HttpsStatusCode.INTERNAL_SERVER_ERROR,
			"Server isn't able to create the user right now. Try again after sometime"
		);
	}
	return res
		.status(200)
		.json(
			new APIResponse(
				HttpsStatusCode.OK,
				newlyCreatedUser,
				'User created successfully'
			)
		);
};
export { registerUser };
