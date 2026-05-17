import express from 'express';
import * as authController from '../controllers/authController.mjs';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/register', authController.register);

export default router;