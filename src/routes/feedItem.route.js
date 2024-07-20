import { Router } from 'express';
import {
	getFeedItem,
	updateFeedItem
} from '../controllers/feedItem.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router
	.route('/i/:feedItemID')
	.get(verifyAccess, getFeedItem)
	.patch(verifyAccess, updateFeedItem);

export default router;
