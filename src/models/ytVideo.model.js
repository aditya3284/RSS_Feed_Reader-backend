import { Schema, model } from 'mongoose';

const youTubeVideoSchema = new Schema(
	{
		videoId: {
			type: String,
			required: [true, 'youtube video id is required'],
		},
		videoTitle: {
			type: String,
			required: [true, 'youtube video title is required'],
		},
		videoThumbnailUrl: {
			type: String,
			trim: true,
			required: [true, 'youtube video thumbnail URL is required'],
		},
		videoLink: {
			type: String,
			trim: true,
			required: [true, 'youtube video link is required'],
		},
		videoDescription: {
			type: String,
			trim: true,
			required: [true, 'youtube video description is required'],
		},
		channelId: {
			type: String,
		},
		channel: {
			type: String,
		},
		publishedAtYouTube: {
			type: Date,
			required: [true, 'media publish information is required'],
		},
		updatedAtYouTube: {
			type: Date,
			required: [true, 'media update information is required'],
		},
		viewsOnYouTube: {
			type: Number,
			default: 0,
		},
		likesOnYoutube: {
			type: Number,
			default: 0,
		},
		hasWatched: {
			type: Boolean,
			default: false,
		},
		fetchedAt: {
			type: Date,
			required: [true, 'fetch time is required'],
		},
		watchedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'video consumer information is required'],
		},
	},
	{ timestamps: true, minimize: true }
);

export const YouTubeVideo = model('YouTubeVideo', youTubeVideoSchema);
