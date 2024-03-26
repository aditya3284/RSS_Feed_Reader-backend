import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';
import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import {
	validateLoginRequest,
	validateRegistorRequest,
} from '../utils/validate.js';

const generateAccessAndRefreshTokens = async (userID) => {
	try {
		const user = await User.findById(userID);
		const accessToken = await user.generateAccessToken();
		const refreshToken = await user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateModifiedOnly: true });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new APIError(
			HttpsStatusCode.INTERNAL_SERVER_ERROR,
			'Token creation failed due to some internal issues'
		);
	}
};

const registerUser = async (req, res, next) => {
	try {
		const { error, value } = validateRegistorRequest(req.body);

		if (error) {
			console.log("joi validation error");
			throw new APIError(HttpsStatusCode.BAD_REQUEST, error.details.map((msg)=>msg.message));			
		}

		const { username, email, password } = value;

		const existingUser = await User.findOne({
			$or: [{ username }, { email }],
		});

		if (existingUser) {
			console.log("user already exists");
			throw new APIError(HttpsStatusCode.CONFLICT, 'User already exists');
		}

		const user = await User.create({
			username,
			email,
			password,
		});

		const newlyCreatedUser = await User.findById(user._id).select(
			'+_id +username +email'
		);

		if (!newlyCreatedUser) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				"Server isn't able to create the user right now. Try again after sometime"
			);
		}
		return res
			.status(201)
			.json(
				new APIResponse(
					HttpsStatusCode.CREATED,
					newlyCreatedUser,
					'User created successfully'
				)
			);
	} catch (error) {
		console.log("register catch");
		next(new APIError(error.httpStatusCode,error.message));
	}
};

const loginUser = async (req, res, next) => {
	try {
		const { error, value } = await validateLoginRequest(req.body);

		if (error) {
			throw new APIError(HttpsStatusCode.BAD_REQUEST, error);
		}

		const { email, password } = value;

		const user = await User.findOne({ email });

		if (!user) {
			throw new APIError(HttpsStatusCode.NOT_FOUND, 'User does not exist');
		}

		const isPasswordValid = await user.validatePasswordFromDb(password);

		if (!isPasswordValid) {
			throw new APIError(
				HttpsStatusCode.UNAUTHORIZED,
				'Invalid login credentials'
			);
		}

		const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
			user._id
		);

		const loggedInUser = await User.findById(user._id).select(
			'+_id, +username, +email +fullName.firstName'
		);

		const cookieOptions = { httpOnly: true, secure: true, sameSite: 'strict' };

		return res
			.status(200)
			.cookie('accessToken', accessToken, cookieOptions)
			.cookie('refreshToken', refreshToken, cookieOptions)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ user: loggedInUser },
					'User Logged In Successfully'
				)
			);
	} catch (error) {
		next(error);
	}
};
export { registerUser, loginUser };
