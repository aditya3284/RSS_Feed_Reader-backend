import multer from 'multer';

const diskStorage = multer.diskStorage({
	destination: (res, file, callback) => {
		callback(null, './public/assests');
	},
	filename: (req, file, callback) => {
		callback(null, file.originalname);
	},
});

const upload = multer({
	storage: diskStorage,
	limits: { fieldSize: 1 * 1024 * 1024 },
});

export default upload;
