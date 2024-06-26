import { Router } from 'express';
import {
	createFeed,
	deleteFeed,
	getFeed,
	retrieveUserFeeds,
	updateUserFeed,
} from '../controllers/feed.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/u/:username').get(verifyAccess, retrieveUserFeeds);

router
	.route('/f/:feedID')
	.get(verifyAccess, getFeed)
	.patch(verifyAccess, updateUserFeed)
	.delete(verifyAccess, deleteFeed);

router.route('/submit').post(verifyAccess, createFeed);

export default router;
