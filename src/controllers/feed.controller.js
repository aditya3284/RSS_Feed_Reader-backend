import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import mongoose from 'mongoose';
import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';
import { Feed } from '../models/feed.model.js';
import { validateFeedInfo, validateFeedURL } from '../utils/validate.js';
import { SaveFeedItemInDatabase, fetchFeed, parseFeed } from '../utils/feed.js';
import { feedItem } from '../models/feedItem.model.js';
import { deleteFeedItemsFromDatabase } from '../utils/feedItem.js';

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
		const { feedName } = req.params;
		const { error, value } = validateFeedInfo(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const updatedItem = await Feed.findOneAndUpdate({ name: feedName }, value, {
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
		const userId = String(req.userID);
		const { feedName } = req.params;

		const feed = await Feed.aggregate()
			.match({
				$and: [
					{ name: feedName },
					{ addedBy: new mongoose.Types.ObjectId(userId) },
				],
			})
			.lookup({
				from: 'feeditems',
				localField: '_id',
				foreignField: 'sourceFeed',
				as: 'items',
			})
			.project({ name: 1, items: 1, favorite: 1, iconUrl: 1, url: 1 });
		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...feed[0] },
					feed.length !== 0
						? 'Requested Feed Retieved Successfully'
						: "Requested Feed Doesn't Exist"
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

const createFeed = async (req, res, next) => {
	try {
		const { error, value } = validateFeedURL(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}
		const feedURL = value.feedURL;
		const existingFeed = await Feed.findOne({ url: feedURL });

		if (existingFeed) {
			throw new APIError(HttpsStatusCode.CONFLICT, 'Feed already exists');
		}

		const feedResponse = await fetchFeed(feedURL);
		const parsedFeed = await parseFeed(feedResponse);
		const feed = await Feed.create({
			name: parsedFeed.feed.author[0].name[0],
			url: parsedFeed.feed.author[0].uri[0],
			lastFetched: new Date(),
			addedBy: req.userID,
		});

		await SaveFeedItemInDatabase(parsedFeed, feed._id);

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
		const { feedName } = req.params;

		const deletedFeed = await Feed.findOneAndDelete({
			$and: [{ name: feedName }, { addedBy: req.userID }],
		}).select('+name +url +iconUrl +description +addedBy +favorite');

		const feedItemsToDelete = await feedItem.find({
			sourceFeed: deletedFeed?._id,
		});

		await deleteFeedItemsFromDatabase(feedItemsToDelete);

		if (!deletedFeed) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				"Either this feed doesn't exist already or you provided a invalid feed information !! Try agian Later"
			);
		}
		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...deletedFeed?._doc },
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

export { createFeed, deleteFeed, getFeed, retrieveUserFeeds, updateUserFeed };
