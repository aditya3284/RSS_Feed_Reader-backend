import connectDB from './db/index.js';
import app from './app.js';

const PORT = process.env.PORT || 3000;

connectDB()
	.then((db) => {
		console.log(
			`\nMongoDB connected successfully !! Database Host : ${db.connection.host}\n`
		);

		app.on('error', (error) => {
			console.log('\nServer Error Occured !!/n ERROR: ', error);
			throw error;
		});

		app.listen(PORT, () => {
			console.log(`\nServer listening on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.log('\nServer Connection Failed !!\nERROR: ', error);
	});
