import { Router } from 'express';
import { verifyAccess } from '../middlewares/authentication.middleware.js';
import {
	getFeedItem,
	updateFeedItem,
} from '../controllers/feedItem.controller.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router
	.route('/i/:feedItemID')
	.get(verifyAccess, getFeedItem)
	.patch(verifyAccess, updateFeedItem);

export default router;
