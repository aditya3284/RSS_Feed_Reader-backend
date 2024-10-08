import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { HttpsStatusCode, cookieOptions } from '../constants.js';
import { Feed } from '../models/feed.model.js';
import { feedItem } from '../models/feedItem.model.js';
import { User } from '../models/user.model.js';
import {
	removeImageFromCloudinary,
	uploadImageToCloudinary,
} from '../utils/cloudinary.js';
import APIError from '../utils/errors.js';
import { SaveFeedItemInDatabase, fetchFeed, parseFeed } from '../utils/feed.js';
import { deleteFeedItemsFromDatabase } from '../utils/feedItem.js';
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
			'+_id, +username, +email +fullName +dateOfBirth +profilePicture'
		);

		return res
			.status(200)
			.cookie('accessToken', accessToken, cookieOptions)
			.cookie('refreshToken', refreshToken, cookieOptions)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					loggedInUser,
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
			//logout user
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
			' +profilePicture +gender +fullName +dateOfBirth'
		);
		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					user,
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
		).select('+fullName +gender');

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
		).select('+fullName +gender +dateOfBirth');

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
		const deletedUser =
			await User.findByIdAndDelete(userID).select('+allFeeds');

		const deleteUserFeeds = deletedUser.allFeeds.map(async (element) => {
			const feedItemsToDelete = await feedItem.find({
				sourceFeed: element?.feedID,
			});

			await deleteFeedItemsFromDatabase(feedItemsToDelete, userID);
			await Feed.findByIdAndDelete(element.feedID);
		});

		await Promise.all(deleteUserFeeds);

		await removeImageFromCloudinary(deletedUser.profilePicture.image_id);

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

const getProfilePicture = async (req, res, next) => {
	try {
		const userID = req.userID;

		if (!userID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}
		const user = await User.findById(userID).select(
			'+profilePicture +fullName'
		);
		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ profilePicture: user.profilePicture },
					'User profile picture retrieved successfully'
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

const updateProfilePicture = async (req, res, next) => {
	try {
		const userID = req.userID;
		const profilePicture = req.file?.path;

		if (!userID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}

		const user = await User.findById(userID).select('+profilePicture');

		const uploadedImage = await uploadImageToCloudinary(profilePicture);

		if (uploadedImage instanceof Error) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Failed to update the image, try after sometime'
			);
		}

		const updatedUser = await User.findByIdAndUpdate(
			userID,
			{
				$set: {
					profilePicture: {
						image_id: uploadedImage.public_id,
						format: uploadedImage.format,
						URL: uploadedImage.url,
					},
				},
			},
			{ new: true, runValidators: true }
		).select('+profilePicture');

		if (updatedUser.profilePicture.URL === uploadedImage.url) {
			await removeImageFromCloudinary(user.profilePicture.image_id);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ profilePicture: updatedUser.profilePicture },
					'User profile picture updated successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message || 'Failed to fulfil the request, try agian later'
			)
		);
	}
};

const deleteProfilePicture = async (req, res, next) => {
	try {
		const userID = req.userID;

		if (!userID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}

		const user = await User.findById(userID).select('+profilePicture');

		const updatedUser = await User.findByIdAndUpdate(
			userID,
			{
				$set: {
					profilePicture: {
						image_id: null,
						format: null,
						URL: null,
					},
				},
			},
			{ new: true }
		).select('+profilePicture');

		if (updatedUser.profilePicture.image_id === null) {
			await removeImageFromCloudinary(user.profilePicture.image_id);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					updatedUser.profilePicture,
					'User profile picture removed successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message || 'Failed to complete the request, try after sometime'
			)
		);
	}
};

const getReadHistory = async (req, res, next) => {
	try {
		const userID = String(req.userID);

		const user = await User.aggregate()
			.match({ _id: new mongoose.Types.ObjectId(userID) })
			.lookup({
				from: 'feeditems',
				localField: '_id',
				foreignField: 'readBy',
				as: 'readHistory',
			})
			.unwind({ path: '$readHistory' })
			.addFields({
				'readHistory.daysAgo': {
					$dateDiff: {
						startDate: '$readHistory.lastOpenedAt',
						endDate: new Date(),
						unit: 'day',
					},
				},
			})
			.group({
				_id: '$readHistory.daysAgo',
				history: { $push: '$readHistory' },
			})
			.sort({ _id: 'ascending' })
			.project({
				heading: {
					$switch: {
						branches: [
							{ case: { $eq: ['$_id', 0] }, then: 'today' },
							{ case: { $eq: ['$_id', 1] }, then: 'yesterday' },
							{ case: { $eq: ['$_id', 2] }, then: '2 days ago' },
							{ case: { $eq: ['$_id', 3] }, then: '3 days ago' },
							{ case: { $eq: ['$_id', 4] }, then: '4 days ago' },
							{ case: { $eq: ['$_id', 5] }, then: '5 days ago' },
							{ case: { $eq: ['$_id', 6] }, then: '6 days ago' },
							{
								case: { $and: [{ $gte: ['$_id', 7] }, { $lt: ['$_id', 14] }] },
								then: '1 week ago',
							},
							{
								case: { $and: [{ $gte: ['$_id', 14] }, { $lt: ['$_id', 21] }] },
								then: '2 week ago',
							},
							{
								case: { $and: [{ $gte: ['$_id', 21] }, { $lt: ['$_id', 28] }] },
								then: '3 week ago',
							},
							{
								case: { $and: [{ $gte: ['$_id', 28] }, { $lt: ['$_id', 35] }] },
								then: '1 month ago',
							},
							{
								case: { $and: [{ $gte: ['$_id', 35] }, { $lt: ['$_id', 65] }] },
								then: '2 months ago',
							},
							{
								case: { $and: [{ $gte: ['$_id', 65] }, { $lt: ['$_id', 95] }] },
								then: '3 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 95] }, { $lt: ['$_id', 125] }],
								},
								then: '4 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 125] }, { $lt: ['$_id', 155] }],
								},
								then: '5 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 155] }, { $lt: ['$_id', 185] }],
								},
								then: '6 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 185] }, { $lt: ['$_id', 215] }],
								},
								then: '7 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 215] }, { $lt: ['$_id', 245] }],
								},
								then: '8 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 245] }, { $lt: ['$_id', 275] }],
								},
								then: '9 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 275] }, { $lt: ['$_id', 305] }],
								},
								then: '10 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 305] }, { $lt: ['$_id', 335] }],
								},
								then: '11 months ago',
							},
							{
								case: {
									$and: [{ $gte: ['$_id', 335] }, { $lt: ['$_id', 365] }],
								},
								then: 'a year ago',
							},
						],
						default: 'Older',
					},
				},
				history: {
					$sortArray: { input: '$history', sortBy: { lastOpenedAt: -1 } },
				},
			});

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					user,
					'User history retrieved successfully'
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

const getLikedFeedItems = async (req, res, next) => {
	try {
		const userID = String(req.userID);
		const limit = parseInt(req.query.limit ?? 5);
		const skip = parseInt(req.query.offset ?? 0);

		const user = await User.aggregate()
			.match({ _id: new mongoose.Types.ObjectId(userID) })
			.lookup({
				from: 'feeditems',
				localField: 'likedFeedItems',
				foreignField: '_id',
				as: 'likedFeedItemsList',
			})
			.project({
				likedFeedItemsList: {
					$slice: [
						{
							$sortArray: {
								input: '$likedFeedItemsList',
								sortBy: { updatedAt: -1 },
							},
						},
						skip,
						limit,
					],
				},
				totalLikedFeedItem: { $size: '$likedFeedItemsList' },
			});

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...user[0] },
					'User liked feed items retrieved successfully'
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

const getLikedFeeds = async (req, res, next) => {
	try {
		const userID = String(req.userID);
		const limit = parseInt(req.query.limit ?? 5);
		const skip = parseInt(req.query.offset ?? 0);

		const user = await User.aggregate()
			.match({ _id: new mongoose.Types.ObjectId(userID) })
			.lookup({
				from: 'feeds',
				localField: 'likedFeeds',
				foreignField: '_id',
				as: 'likedFeedsList',
			})
			.project({
				likedFeedsList: {
					$slice: [
						{
							$sortArray: {
								input: '$likedFeedsList',
								sortBy: { updatedAt: -1 },
							},
						},
						skip,
						limit,
					],
				},
			});

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...user[0] },
					'User liked feed retrieved successfully'
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

const getAllFeedItems = async (req, res, next) => {
	try {
		const userID = String(req.userID);
		const limit = parseInt(req.query.limit ?? 6);
		const skip = parseInt(req.query.offset ?? 0);
		const user = await User.findById(req.userID).select('+allFeeds');

		const syncFeeds = user.allFeeds.map(async ({ feedID, url }) => {
			const xmlResponse = await fetchFeed(url);
			const parsedFeed = await parseFeed(xmlResponse);
			await SaveFeedItemInDatabase(parsedFeed, feedID, req.userID);
		});

		await Promise.all(syncFeeds);

		const itemList = await User.aggregate()
			.match({ _id: new mongoose.Types.ObjectId(userID) })
			.lookup({
				from: 'feeditems',
				localField: '_id',
				foreignField: 'addedForUser',
				as: 'feedItemsList',
			})
			.project({
				feedItemsList: {
					$slice: [
						{
							$sortArray: {
								input: '$feedItemsList',
								sortBy: { publishedAt: -1 },
							},
						},
						skip,
						limit,
					],
				},
				totalCount: { $size: '$feedItemsList' },
			});

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...itemList[0] },
					'User feed items retrieved successfully'
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
	deleteProfilePicture,
	deleteUserProfile,
	getAllFeedItems,
	getLikedFeedItems,
	getLikedFeeds,
	getProfilePicture,
	getReadHistory,
	getUserProfileDetails,
	logOutUser,
	loginUser,
	refreshAccessToken,
	registerUser,
	registerUserProfileDetails,
	updateProfilePicture,
	updateUserProfileDetails,
};
