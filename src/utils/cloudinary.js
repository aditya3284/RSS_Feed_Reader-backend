import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { allowedImageFormats } from '../constants.js';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (localImagePath) => {
	try {
		if (!localImagePath) {
			throw new Error('Image upload failed due to invalid data');
		}
		const imageUploadOptions = {
			resource_type: 'image',
			format: 'webp',
			allowed_formats: allowedImageFormats,
		};

		const upload = await cloudinary.uploader.upload(
			localImagePath,
			imageUploadOptions
		);
		return upload;
	} catch (error) {
		return new Error(error.message || 'Image upload failed!! Try again later');
	} finally {
		fs.unlinkSync(localImagePath);
	}
};

const removeImageFromCloudinary = async (publicId) => {
	try {
		if (!publicId) {
			return new Error('Image removal failed due to invalid data');
		}

		const imageDestroyOptions = { resource_type: 'image' };

		return await cloudinary.uploader.destroy(publicId, imageDestroyOptions);
	} catch (error) {
		return new Error(error.message || 'Image removal failed!! Try again later');
	}
};

export { uploadImageToCloudinary, removeImageFromCloudinary };
