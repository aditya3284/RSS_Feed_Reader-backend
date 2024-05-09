import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import mongoose from 'mongoose';
import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';
import { Feed } from '../models/feed.model.js';
import { validateFeedInfo } from '../utils/validate.js';

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

export { retrieveUserFeeds, updateUserFeed };
