import { Router } from 'express';
import {
	createFeed,
	deleteFeed,
	deleteFeedIcon,
	getFeed,
	getFeedIcon,
	likeFeed,
	retrieveUserFeeds,
	updateFeedIcon,
	updateUserFeed,
} from '../controllers/feed.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';
import upload from '../middlewares/multer.middlerware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/u/:username').get(verifyAccess, retrieveUserFeeds);

router
	.route('/f/:feedID')
	.get(verifyAccess, getFeed)
	.patch(verifyAccess, updateUserFeed)
	.delete(verifyAccess, deleteFeed);

router.route('/submit').post(verifyAccess, createFeed);

router
	.route('/icon/:feedID')
	.get(verifyAccess, getFeedIcon)
	.patch(verifyAccess, upload.single('feedIcon'), updateFeedIcon)
	.delete(verifyAccess, deleteFeedIcon);

router.route('/like').patch(verifyAccess, likeFeed);

export default router;
