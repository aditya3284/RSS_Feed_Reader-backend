import { Schema, model } from 'mongoose';

const itemListSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'list name is required'],
		},
		description: {
			type: String,
			trim: true,
		},
		iconUrl: {
			type: String,
		},
		items: [
			{
				type: Schema.Types.ObjectId,
				ref: 'feedItem',
			},
		],
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true, minimize: true }
);

export const itemList = model('itemList', itemListSchema);
