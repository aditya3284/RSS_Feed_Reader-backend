import { Router } from 'express';
import { verifyAccess } from '../middlewares/authentication.middleware.js';
import {
	createFeed,
	deleteFeed,
	getFeed,
	retrieveUserFeeds,
	updateUserFeed,
} from '../controllers/feed.controller.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/u/:username').get(verifyAccess, retrieveUserFeeds);

router
	.route('/f/:feedName')
	.get(verifyAccess, getFeed)
	.patch(verifyAccess, updateUserFeed)
	.delete(verifyAccess, deleteFeed);

router.route('/submit').post(verifyAccess, createFeed);

export default router;
