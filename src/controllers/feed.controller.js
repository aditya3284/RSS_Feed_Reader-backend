import mongoose from 'mongoose';
import { HttpsStatusCode } from '../constants.js';
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
import { validateFeedInfo, validateFeedURL } from '../utils/validate.js';

const retrieveUserFeeds = async (req, res, next) => {
	try {
		const userId = String(req.userID);
		const { username } = req.params;
		const userFeeds = await User.aggregate()
			.match({
				$and: [{ _id: new mongoose.Types.ObjectId(userId) }, { username }],
			})
			.lookup({
				from: 'feeds',
				localField: '_id',
				foreignField: 'addedBy',
				as: 'Feeds',
			})
			.project({ Feeds: 1 });

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...userFeeds[0] },
					userFeeds[0].Feeds
						? 'All User Feeds Retieved Successfully'
						: 'User has no added any feed'
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

const updateUserFeed = async (req, res, next) => {
	try {
		const { feedID } = req.params;
		const { error, value } = validateFeedInfo(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const updatedItem = await Feed.findOneAndUpdate(feedID, value, {
			new: true,
			runValidators: true,
		});

		if (!updatedItem) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				"Maybe the feed you want to access doesn't exist or Provided information is irrelevant!! Try later"
			);
		}

		if (updatedItem instanceof Error) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Failed to update feed information!! Try agian Later'
			);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...updatedItem?._doc },
					'Feed information updated successfully'
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

const getFeed = async (req, res, next) => {
	try {
		const { feedID } = req.params;

		const feed = await Feed.findById(feedID);

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					feed,
					feed.length !== 0
						? 'Requested Feed Retieved Successfully'
						: "Requested Feed Doesn't Exist"
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message || 'Failed to complete your request, try after sometime'
			)
		);
	}
};

const createFeed = async (req, res, next) => {
	try {
		const { error, value } = validateFeedURL(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const userId = req.userID;
		const feedURL = value.feedURL;
		const existingFeed = await Feed.findOne({ url: feedURL });

		if (existingFeed) {
			throw new APIError(HttpsStatusCode.CONFLICT, 'Feed already exists');
		}

		const feedResponse = await fetchFeed(feedURL);
		const parsedFeed = await parseFeed(feedResponse);
		const feed = await Feed.create({
			name: parsedFeed.feed.author[0].name[0],
			websiteURL: parsedFeed.feed.author[0].uri[0],
			url: feedURL,
			lastFetched: new Date(),
			addedBy: userId,
		});

		await User.findByIdAndUpdate(
			userId,
			{
				$push: { allFeeds: { feedID: feed._id, url: feed.url } },
			},
			{ runValidators: true }
		);

		await SaveFeedItemInDatabase(parsedFeed, feed._id, userId);

		const newlyCreatedUser = await Feed.findById(feed._id).select(
			'+_id +name +url'
		);

		if (!newlyCreatedUser) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				"Server isn't able to parse and store the feed right now. Try again after sometime"
			);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...feed?._doc },
					'Feed Added successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message || 'Submition failed!! Try again later '
			)
		);
	}
};

const deleteFeed = async (req, res, next) => {
	try {
		const feedID = String(req.params.feedID);
		const userId = req.userID;

		const deletedFeed = await Feed.findOneAndDelete({
			$and: [
				{ _id: new mongoose.Types.ObjectId(feedID) },
				{ addedBy: req.userID },
			],
		}).select('+name +url +icon +addedBy +favorite');

		if (!deletedFeed) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				"Either this feed doesn't exist already or you provided a invalid feed information !! Try agian Later"
			);
		}

		const user = await User.findById(userId).select('+allFeeds +likedFeeds');

		const feedIndex = user.allFeeds.findIndex(
			(feed) => feed.url === deletedFeed.url || feed.feedID === deletedFeed._id
		);

		if (0 <= feedIndex && feedIndex < user.allFeeds.length) {
			user.allFeeds.splice(feedIndex, 1);
		}

		const index = user.likedFeeds.indexOf(deletedFeed._id);

		if (0 <= index && index < user.likedFeeds.length) {
			user.likedFeeds.splice(index, 1);
		}

		await user.save({ validateModifiedOnly: true });

		const feedItemsToDelete = await feedItem.find({
			sourceFeed: deletedFeed?._id,
		});

		await deleteFeedItemsFromDatabase(feedItemsToDelete, userId);
		await removeImageFromCloudinary(deletedFeed.icon.image_id);

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					deletedFeed,
					'Feed removed successfully'
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message || 'Failed user request!! Try after sometime'
			)
		);
	}
};

const getFeedIcon = async (req, res, next) => {
	try {
		const { feedID } = req.params;

		if (!feedID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}
		const icon = await Feed.findById(feedID).select('+icon');

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					icon,
					'Feed Icon retrieved successfully'
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

const updateFeedIcon = async (req, res, next) => {
	try {
		const feedID = req.params.feedID;
		const iconPath = req.file?.path;

		if (!feedID) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Invalid user request');
		}

		const feed = await Feed.findById(feedID).select('+icon');

		const uploadedImage = await uploadImageToCloudinary(iconPath);

		if (uploadedImage instanceof Error) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Failed to update the image, try after sometime'
			);
		}

		const updatedFeed = await Feed.findByIdAndUpdate(
			feedID,
			{
				$set: {
					icon: { image_id: uploadedImage.public_id, URL: uploadedImage.url },
				},
			},
			{ new: true, runValidators: true }
		).select('+icon');

		if (updatedFeed.icon.URL === uploadedImage.url) {
			await removeImageFromCloudinary(feed.icon.image_id);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ icon: updatedFeed.icon },
					'Feed icon updated successfully'
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

const deleteFeedIcon = async (req, res, next) => {
	try {
		const { feedID } = req.params;

		if (!feedID) {
			throw new APIError(HttpsStatusCode.BAD_REQUEST, 'Invalid user request');
		}

		const feed = await Feed.findById(feedID).select('+icon');

		const updatedFeed = await Feed.findByIdAndUpdate(
			feedID,
			{
				$set: {
					icon: {
						image_id: null,
						URL: null,
					},
				},
			},
			{ new: true }
		).select('+icon');

		if (updatedFeed.icon.image_id === null) {
			await removeImageFromCloudinary(feed.icon.image_id);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					updatedFeed.icon,
					'Feed icon removed successfully'
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

export {
	createFeed,
	deleteFeed,
	deleteFeedIcon,
	getFeed,
	getFeedIcon,
	retrieveUserFeeds,
	updateFeedIcon,
	updateUserFeed,
};
