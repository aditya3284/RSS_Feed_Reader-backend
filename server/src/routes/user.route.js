import { Router } from 'express';
import {
	changeUserPassword,
	deleteUserProfile,
	getProfilePicture,
	getUserProfileDetails,
	logOutUser,
	loginUser,
	refreshAccessToken,
	registerUser,
	registerUserProfileDetails,
	updateProfilePicture,
	updateUserProfileDetails,
} from '../controllers/user.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';
import upload from '../middlewares/multer.middlerware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/signup').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyAccess, logOutUser);
router.route('/refresh-token').post(verifyAccess, refreshAccessToken);
router.route('/profile/password').patch(verifyAccess, changeUserPassword);
router
	.route('/profile')
	.get(verifyAccess, getUserProfileDetails)
	.post(verifyAccess, registerUserProfileDetails)
	.patch(verifyAccess, updateUserProfileDetails)
	.delete(verifyAccess, deleteUserProfile);
router
	.route('/profile/picture')
	.get(verifyAccess, getProfilePicture)
	.patch(
		verifyAccess,
		upload.single('profilePictureToUpdate'),
		updateProfilePicture
	);

export default router;
