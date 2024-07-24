import rssParser from 'rss-parser';
import { setValuesToFeedItem } from './feedItem.js';

const parser = new rssParser({ customFields: {} });

const fetchRSSFeed = async (feedURL) => {
	try {
		const feed = await parser.parseURL(feedURL);
		console.log(feed);
	} catch (error) {
		return new Error(error.message || 'Failed to fetch the feed');
	}
};

const SaveRssFeedItemInDatabase = async (feed, sourceFeedID, userId) => {
	try {
		const createdFeed = feed.items.map(async (element) => {
			await setValuesToFeedItem(element, sourceFeedID, userId);
		});

		await Promise.all(createdFeed);
	} catch (error) {
		throw new Error(
			error.message || 'failed to save the feed item to database'
		);
	}
};

export { SaveRssFeedItemInDatabase, fetchRSSFeed };
