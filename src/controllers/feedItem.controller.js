import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import { HttpsStatusCode } from '../constants.js';
import { feedItem } from '../models/feedItem.model.js';

const getFeedItem = async (req, res, next) => {
	try {
		const { feedItemID } = req.params;

		const Item = await feedItem.findByIdAndUpdate(
			feedItemID,
			{
				$set: { readBy: req.userID, hasRead: true },
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

export { getFeedItem };
