import jwt from 'jsonwebtoken';
import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';
import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import {
	validateLoginRequest,
	validateRegistorRequest,
	validateUserPasswordChangeRequest,
	validateUserProfileDetails,
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
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const { username, email, password } = value;

		const existingUser = await User.findOne({
			$or: [{ username }, { email }],
		});

		if (existingUser) {
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
		next(
			new APIError(
				error.httpStatusCode || 500,
				error.message || 'registration failed!! Try again later '
			)
		);
	}
};

const loginUser = async (req, res, next) => {
	try {
		const { error, value } = validateLoginRequest(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const { email, password } = value;

		const user = await User.findOne({ email }).select('+password');

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

		const cookieOptions = { httpOnly: true, secure: false, sameSite: 'strict' };

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
		next(
			new APIError(
				error.httpStatusCode || 500,
				error.message || 'login process failed'
			)
		);
	}
};

const logOutUser = async (req, res, next) => {
	try {
		await User.findByIdAndUpdate(
			req.userID,
			{
				$unset: { refreshToken: 1 },
			},
			{ new: true }
		);
		const cookieOptions = { httpOnly: true, secure: false, sameSite: 'strict' };
		return res
			.status(200)
			.clearCookie('accessToken', cookieOptions)
			.clearCookie('refreshToken', cookieOptions)
			.json(
				new APIResponse(HttpsStatusCode.OK, {}, 'User Logged out Successfully')
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || 403,
				error.message || 'Access denied'
			)
		);
	}
};

const refreshAccessToken = async (req, res, next) => {
	try {
		const incomingRefreshToken = req.cookies?.refreshToken;
		if (!incomingRefreshToken) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Unauthorized Request');
		}

		const tokenPayload = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_JWT_SECRET,
			{
				algorithms: process.env.REFRESH_TOKEN_JWT_ALGORITHM,
				ignoreExpiration: false,
			}
		);

		const user = await User.findById(tokenPayload.userID).select(
			'+refreshToken'
		);

		if (!user) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid refresh token');
		}

		if (incomingRefreshToken !== user.refreshToken) {
			throw new APIError(
				HttpsStatusCode.UNAUTHORIZED,
				'Refresh token is invalid'
			);
		}

		const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
			user._id
		);

		const cookieOptions = { httpOnly: true, secure: false, sameSite: 'strict' };

		return res
			.status(200)
			.cookie('accessToken', accessToken, cookieOptions)
			.cookie('refreshToken', refreshToken, cookieOptions)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{
						access_Token: accessToken,
						refresh_Token: refreshToken,
					},
					'Access Token refreshed Successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.UNAUTHORIZED,
				error.message || 'Invalid Refresh Token'
			)
		);
	}
};

const changeUserPassword = async (req, res, next) => {
	try {
		const { error, value } = validateUserPasswordChangeRequest(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const { oldPassword, newPassword } = value;
		const userID = req.userID;

		const user = await User.findById(userID).select('+password');
		const oldPasswordFromDb = user.password;

		const isOldPasswordCorrect = await user.validatePasswordFromDb(oldPassword);

		if (!isOldPasswordCorrect) {
			throw new APIError(
				HttpsStatusCode.UNAUTHORIZED,
				'Invalid User Credentials'
			);
		}

		user.password = newPassword;
		await user.save({ validateModifiedOnly: true });

		const updatedUser = await User.findById(userID).select('+password');

		if (updatedUser.password === oldPasswordFromDb) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Failed to fulfil your request. Try again later'
			);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{},
					'User credential modification request completed successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.BAD_REQUEST,
				error.message || 'Invalid User Input'
			)
		);
	}
};

const getUserProfileDetails = async (req, res, next) => {
	try {
		const userID = req.userID;

		if (!userID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}
		const user = await User.findById(userID).select(
			'+coverImage +profilePicture +age +gender +fullName'
		);
		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...user._doc },
					'User profile data retrieved successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.UNAUTHORIZED,
				error.message || 'Unauthorized user request'
			)
		);
	}
};

const registerUserProfileDetails = async (req, res, next) => {
	try {
		const { error, value } = validateUserProfileDetails(req.body);
		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((err) => err.message)
			);
		}

		const userId = req.userID;
		const { fullName, gender, age } = value;

		const user = await User.findByIdAndUpdate(
			userId,
			{
				$set: { fullName, gender, age },
			},
			{ new: true, runValidators: true }
		).select('+fullName +gender +age');

		if (!user) {
			throw new APIError(HttpsStatusCode.NOT_FOUND, 'User not found');
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ user },
					'User Profile details registred successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.BAD_REQUEST,
				error.message ||
					'Failed to register user details. Please try again later.'
			)
		);
	}
};

const updateUserProfileDetails = async (req, res, next) => {
	try {
		const { error, value } = validateUserProfileDetails(req.body);
		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((err) => err.message)
			);
		}

		const userId = req.userID;
		const user = await User.findByIdAndUpdate(
			userId,
			{
				$set: value,
			},
			{ new: true, runValidators: true }
		).select('+fullName +gender +age');

		if (!user) {
			throw new APIError(HttpsStatusCode.NOT_FOUND, 'User not found');
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ user },
					'User Profile details updated successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.BAD_REQUEST,
				error.message ||
					'Failed to update user details. Please try again later.'
			)
		);
	}
};

const deleteUserProfile = async (req, res, next) => {
	try {
		const userID = req.userID;
		if (!userID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}
		const deletedUser = await User.findByIdAndDelete(userID).select(
			'+coverImage +profilePicture +age +gender +fullName'
		);

		const cookieOptions = {
			httpOnly: true,
			secure: false,
			sameSite: 'strict',
		};

		return res
			.status(200)
			.clearCookie('refreshToken', cookieOptions)
			.clearCookie('accessToken', cookieOptions)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ deletedUser },
					'User profile removed successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.UNAUTHORIZED,
				error.message || 'Unauthorized user request'
			)
		);
	}
};

export {
	changeUserPassword,
	registerUser,
	loginUser,
	logOutUser,
	refreshAccessToken,
	getUserProfileDetails,
	registerUserProfileDetails,
	updateUserProfileDetails,
	deleteUserProfile,
};
