import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { setValuesToFeedItem } from './feedItem.js';

const parser = new xml2js.Parser();

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
		const feed = await parser.parseStringPromise(feedXML, {
			trim: true,
			strict: true,
		});

		return feed;
	} catch (error) {
		return new Error(error.message || 'Failed to parse the feed');
	}
};

const SaveFeedItemInDatabase = async (feed, sourceFeedID, userId) => {
	try {
		const createdFeed = Object.values(feed.feed.entry).map(async (element) => {
			await setValuesToFeedItem(element, sourceFeedID, userId);
		});

		await Promise.all(createdFeed);
	} catch (error) {
		throw new Error(
			error.message || 'failed to save the feed item to database'
		);
	}
};

export { SaveFeedItemInDatabase, fetchFeed, parseFeed };
