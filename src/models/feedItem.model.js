import { Schema, model } from 'mongoose';

const feedItemSchema = new Schema(
	{
		title: {
			type: String,
			trim: true,
			required: [true, 'feed item title required'],
		},
		sourceFeed: {
			type: Schema.Types.ObjectId,
			ref: 'Feed',
			required: [true, 'source feed required for feed items'],
		},
		url: {
			type: String,
			trim: true,
			required: [true, 'url required for feed items'],
		},
		thumbnailUrl: {
			type: String,
		},
		publishedAt: {
			type: Date,
			required: [true, 'publish information is required'],
		},
		fetchedAt: {
			type: Date,
			required: [true, 'fetch information is required'],
		},
		content: {
			type: String,
		},
		creator: {
			type: String,
			required: [true, 'creator information is required'],
		},
		hasRead: {
			type: Boolean,
			required: [true, 'read status is required'],
			default: false,
		},
		readBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true, minimize: true }
);

export const feedItem = model('feedItem', feedItemSchema);
