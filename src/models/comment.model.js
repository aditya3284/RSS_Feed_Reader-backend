import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
	{
		content: {
			type: String,
			trim: true,
		},
		feedItem: {
			type: Schema.Types.ObjectId,
			ref: 'feedItem',
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true, minimize: true }
);

export const Comment = model('Comment', commentSchema);
