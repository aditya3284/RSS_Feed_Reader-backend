import { feedItem } from '../models/feedItem.model.js';

const setValuesToFeedItem = async (feedItemJSONObject, sourceFeedID) => {
	const item = feedItemJSONObject;
	try {
		const savedItem = await feedItem.create({
			title: item.title[0],
			sourceFeed: sourceFeedID,
			url: item.link[0]['$']['href'],
			thumbnailUrl: item['media:group'][0]['media:thumbnail'][0]['$']['url'],
			publishedAt: item.published,
			fetchedAt: new Date(),
			content:
				item['media:group'][0]['media:content'][0]['$']['url'] +
				['\n'] +
				item['media:group'][0]['media:description'][0],
			creator: item.author[0].name[0],
			hasRead: false,
		});

		return savedItem;
	} catch (error) {
		throw new Error(error.message || 'Feed Item Creation failed');
	}
};

const deleteFeedItem = async (Item) => {
	try {
		return await feedItem
			.findByIdAndDelete(Item._id)
			.select('+_id +sourceFeed +title');
	} catch (error) {
		throw new Error(error.message || 'Feed Item deletion failed');
	}
};

const deleteFeedItemsFromDatabase = async (feedItems) => {
	try {
		const deleteFeedItems = feedItems.map(async (element) => {
			await deleteFeedItem(element);
		});

		await Promise.all(deleteFeedItems);
	} catch (error) {
		throw new Error(
			error.message || 'failed to delete all feed items from database'
		);
	}
};

export { deleteFeedItemsFromDatabase, setValuesToFeedItem };
