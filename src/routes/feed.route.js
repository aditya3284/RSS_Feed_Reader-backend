import { Router } from 'express';
import { verifyAccess } from '../middlewares/authentication.middleware.js';
import {
	retrieveUserFeeds,
	updateUserFeed,
} from '../controllers/feed.controller.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/u/:username').get(verifyAccess, retrieveUserFeeds);

router.route('/f/:feedName').patch(verifyAccess, updateUserFeed);

export default router;
