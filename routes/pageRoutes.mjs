import express from 'express';
import * as pageController from '../controllers/pageController.mjs';

const router = express.Router();

router.get('/', pageController.getHomePage);
router.get('/login', pageController.getLoginPage);

export default router;
