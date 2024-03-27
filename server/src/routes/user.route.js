import { Router } from 'express';
import {
	logOutUser,
	loginUser,
	refreshAccessToken,
	registerUser,
} from '../controllers/user.controller.js';
import { verifyAccess } from '../middlewares/authentication.middleware.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/signup').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyAccess, logOutUser);
router.route('/refresh-token').post(verifyAccess, refreshAccessToken);

export default router;
