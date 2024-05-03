import { Schema, model } from 'mongoose';

const feedCollectionSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'collection name is required'],
		},
		iconUrl: {
			type: String,
		},
		color: {
			type: String,
			trim: true,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'user information is required'],
		},
		feedSubCollection: {
			type: Schema.Types.ObjectId,
			ref: 'feedCollection',
		},
		feeds: {
			type: Schema.Types.ObjectId,
			ref: 'Feed',
		},
	},
	{ timestamps: true, minimize: true }
);

export const feedCollection = model('feedCollection', feedCollectionSchema);
