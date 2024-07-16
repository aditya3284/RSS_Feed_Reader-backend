import { feedItem } from '../models/feedItem.model.js';
import { User } from '../models/user.model.js';

const setValuesToFeedItem = async (
	feedItemJSONObject,
	sourceFeedID,
	userId
) => {
	const item = feedItemJSONObject;
	try {
		const existingFeedItem = await feedItem.find({
			$and: [
				{ title: item.title[0] },
				{ url: item.link[0]['$']['href'] },
				{ sourceFeed: sourceFeedID },
			],
		});

		if (existingFeedItem.length === 0) {
			const savedItem = await feedItem.create({
				title: item.title[0],
				sourceFeed: sourceFeedID,
				url: item.link[0]['$']['href'],
				thumbnailUrl: item['media:group'][0]['media:thumbnail'][0]['$']['url'],
				publishedAt: item.published,
				fetchedAt: new Date(),
				content: item['media:group'][0]['media:description'][0],
				creator: item.author[0].name[0],
				hasRead: false,
				addedForUser: userId,
			});

			return savedItem;
		} else {
			return;
		}
	} catch (error) {
		throw new Error(error.message || 'Feed Item Creation failed');
	}
};

const deleteFeedItem = async (Item, user) => {
	try {
		const index = user.likedFeedItems.indexOf(Item._id);
		if (0 <= index && index < user.likedFeedItems.length) {
			user.likedFeedItems.splice(index, 1);
		}
		return await feedItem
			.findByIdAndDelete(Item._id)
			.select('+_id +sourceFeed +title');
	} catch (error) {
		throw new Error(error.message || 'Feed Item deletion failed');
	}
};

const deleteFeedItemsFromDatabase = async (feedItems, userID) => {
	try {
		const user = await User.findById(userID).select('+likedFeedItems');
		const deleteFeedItems = feedItems.map(async (element) => {
			await deleteFeedItem(element, user);
		});
		await user.save({ validateModifiedOnly: true });

		await Promise.all(deleteFeedItems);
	} catch (error) {
		throw new Error(
			error.message || 'failed to delete all feed items from database'
		);
	}
};

export { deleteFeedItemsFromDatabase, setValuesToFeedItem };
