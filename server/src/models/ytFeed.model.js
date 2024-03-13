import { Schema, model } from 'mongoose';

const youTubeFeedSchema = new Schema(
	{
		link: {
			type: String,
			trim: true,
			required: [true, 'youtube feed link is required'],
		},
		channelId: {
			type: String,
			trim: true,
			required: [true, 'youtube channel ID is required'],
		},
		channelName: {
			type: String,
			trim: true,
			index: true,
			required: [true, 'youtube channel name is required'],
		},
		channelDescription: {
			type: String,
			trim: true,
		},
		channelLink: {
			type: String,
			trim: true,
			required: [true, 'youtube channel link is required'],
		},
		publishedOn: {
			type: Date,
		},
		fetchFrequency: {
			type: Number,
			//TODO: add enum values
		},
		lastFetched: {
			type: Date,
			required: [true, 'last fetch information is required'],
		},
		addedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true, minimize: true }
);

export const YouTubeFeed = model('YouTubeFeed', youTubeFeedSchema);
