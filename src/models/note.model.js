import { Schema, model } from 'mongoose';

const noteSchema = new Schema(
	{
		content: {
			type: String,
			trim: true,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true, minimize: true }
);

export const Note = model('Note', noteSchema);
