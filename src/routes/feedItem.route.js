import { Router } from 'express';
import {
	getAllFeedItems,
	getFeedItem,
	updateFeedItem,
} from '../controllers/feedItem.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router
	.route('/i/:feedItemID')
	.get(verifyAccess, getFeedItem)
	.patch(verifyAccess, updateFeedItem);

router.route('/f/:feedID').get(verifyAccess, getAllFeedItems);

export default router;
