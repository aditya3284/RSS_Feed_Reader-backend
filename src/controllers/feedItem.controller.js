import { HttpsStatusCode } from '../constants.js';
import { feedItem } from '../models/feedItem.model.js';
import APIError from '../utils/errors.js';
import APIResponse from '../utils/response.js';
import { validateFeedItemInfo } from '../utils/validate.js';

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

export { getFeedItem, updateFeedItem };
