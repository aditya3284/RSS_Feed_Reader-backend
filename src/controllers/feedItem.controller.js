import mongoose from 'mongoose';
import { HttpsStatusCode } from '../constants.js';
import { Feed } from '../models/feed.model.js';
import { feedItem } from '../models/feedItem.model.js';
import { User } from '../models/user.model.js';
import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import {
	validateFeedItemInfo,
	validateLikedFeedItem,
} from '../utils/validate.js';

const getFeedItem = async (req, res, next) => {
	try {
		const { feedItemID } = req.params;

		const Item = await feedItem.findByIdAndUpdate(
			feedItemID,
			{
				$set: { readBy: req.userID, hasRead: true, lastOpenedAt: new Date() },
			},
			{ new: true }
		);

		if (Item instanceof Error) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Item Retrival failed!! Try agian Later'
			);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...Item?._doc },
					Item?._doc
						? 'Item retrival successfully completed'
						: 'No Item found! Provide valid Identifier'
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

const updateFeedItem = async (req, res, next) => {
	try {
		const { feedItemID } = req.params;
		const { error, value } = validateFeedItemInfo(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const updatedItem = await feedItem.findByIdAndUpdate(
			feedItemID,
			{ hasRead: value.hasRead, readBy: req.userID, lastOpenedAt: new Date() },
			{
				new: true,
				runValidators: true,
			}
		);

		if (updatedItem instanceof Error) {
			throw new APIError(
				HttpsStatusCode.INTERNAL_SERVER_ERROR,
				'Failed to update the item!! Try agian Later'
			);
		}

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					{ ...updatedItem?._doc },
					updatedItem?._doc
						? 'Item updated successfully'
						: 'No Item Found! Provide valid identifier to perform the requested task'
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
		const userId = String(req.userID);
		const feedID = String(req.params.feedID);

		const feed = await Feed.aggregate()
			.match({
				$and: [
					{ _id: new mongoose.Types.ObjectId(feedID) },
					{ addedBy: new mongoose.Types.ObjectId(userId) },
				],
			})
			.lookup({
				from: 'feeditems',
				localField: '_id',
				foreignField: 'sourceFeed',
				as: 'items',
			})
			.project({
				name: 1,
				items: {
					$sortArray: {
						input: '$items',
						sortBy: { publishedAt: -1 },
					},
				},
				favorite: 1,
				icon: 1,
				url: 1,
				lastFetched: 1,
				createdAt: 1,
				updatedAt: 1,
				websiteURL: 1,
			});

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					feed[0],
					feed.length !== 0
						? 'Requested Feed Retieved Successfully'
						: "Requested Feed Doesn't Exist"
				)
			);
	} catch (error) {
		next(
			new APIError(
				error.httpStatusCode || HttpsStatusCode.INTERNAL_SERVER_ERROR,
				error.message ||
					'Failed to retrive feed items for this feed!! Try again later '
			)
		);
	}
};

const likeFeedItem = async (req, res, next) => {
	try {
		const { error, value } = validateLikedFeedItem(req.body);

		if (error) {
			throw new APIError(
				HttpsStatusCode.BAD_REQUEST,
				error.details.map((msg) => msg.message)
			);
		}

		const userId = req.userID;
		const isLiked = value.favorite;
		const FeedItemURL = value.url;

		const likedFeedItem = await feedItem.findOneAndUpdate(
			{
				$and: [{ url: FeedItemURL }, { addedForUser: userId }],
			},
			{ favorite: isLiked },
			{ runValidators: true, new: true }
		);

		const user = await User.findById(userId).select('+likedFeedItems');

		if (isLiked === true) {
			user.likedFeedItems.push(likedFeedItem._id);
		} else {
			const index = user.likedFeedItems.indexOf(likedFeedItem._id);
			if (0 <= index && index < user.likedFeedItems.length) {
				user.likedFeedItems.splice(index, 1);
			}
		}

		await user.save({ validateModifiedOnly: true });

		return res
			.status(200)
			.json(
				new APIResponse(
					HttpsStatusCode.OK,
					likedFeedItem,
					isLiked
						? 'Feed Item Liked successfully'
						: 'Feed Item Dis-liked successfully'
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

export { getAllFeedItems, getFeedItem, likeFeedItem, updateFeedItem };
