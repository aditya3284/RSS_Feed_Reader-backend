import { Schema, model } from 'mongoose';

const feedSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'feed name is required'],
			unique: true,
			index: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			default: null,
		},
		url: {
			type: String,
			required: [true, 'feed URL is required'],
			trim: true,
		},
		iconUrl: {
			type: String,
			trim: true,
		},
		lastFetched: {
			type: Date,
			required: [true, 'last fetched information is required'],
		},
		fetchFrequency: {
			type: Number,
			//TODO: add enum and decide values
		},
		textDirection: {
			type: String,
			enum: {
				values: ['ltr', 'rtl'],
				message: '{VALUE} is not supported',
			},
			default: 'ltr',
		},
		favorite: {
			type: Boolean,
			default: false,
		},
		addedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'user information is required'],
		},
	},
	{ timestamps: true, minimize: true }
);

export const Feed = model('Feed', feedSchema);
