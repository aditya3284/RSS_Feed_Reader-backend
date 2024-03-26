import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);

router.route('/sign-up').post(registerUser);
router.route("/login").post(loginUser)

export default router;
