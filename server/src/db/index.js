import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
	try {
		return await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
	} catch (error) {
		console.error('\nMongoDB Connection ERROR :\n\n', error);
		throw error;
	}
};

export default connectDB;
