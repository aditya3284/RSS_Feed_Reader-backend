import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import mongoose from 'mongoose';
import { HttpsStatusCode } from '../constants.js';
import { User } from '../models/user.model.js';

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

export { retrieveUserFeeds };
