import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
	try {
		const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		console.log(
			`\nMongoDB connected successfully !! Database Host : ${db.connection.host}\n`
		);
	} catch (error) {
		console.error('\nMongoDB Connection ERROR :\n\n', error);
		process.exit(1);
	}
};

export default connectDB;
