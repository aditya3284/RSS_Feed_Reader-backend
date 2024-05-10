import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { setValuesToFeedItem } from './feedItem.js';

const fetchFeed = async (feedURL) => {
	try {
		const feedResponse = await fetch(feedURL, {
			method: 'get',
		});
		const feedXML = await feedResponse.text();
		return feedXML;
	} catch (error) {
		return new Error(error.message || 'Failed to fetch the feed');
	}
};

const parseFeed = async (feedXML) => {
	try {
		const feed = await xml2js.parseStringPromise(feedXML, {
			trim: true,
			strict: true,
		});

		return feed;
	} catch (error) {
		return new Error(error.message || 'Failed to parse the feed');
	}
};

const SaveFeedItemInDatabase = async (feed, sourceFeedID) => {
	try {
		const createdFeed = Object.values(feed.feed.entry).map(async (element) => {
			await setValuesToFeedItem(element, sourceFeedID);
		});

		await Promise.all(createdFeed);
	} catch (error) {
		throw new Error(
			error.message || 'failed to save the feed item to database'
		);
	}
};

export { fetchFeed, parseFeed, SaveFeedItemInDatabase };
