import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';

const routerOptions = { caseSensitive: false, strict: false };
const router = Router(routerOptions);
router.route('/login').post(registerUser);

export default router;
