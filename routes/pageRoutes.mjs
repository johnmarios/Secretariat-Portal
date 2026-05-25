import express from 'express';
import * as pageController from '../controllers/pageController.mjs';
import { fetchStudentMiddleware, fetchStudentByTicketIdMiddleware } from '../middlewares/ticketContext.mjs';

const router = express.Router();

// --- Public pages ---
router.get('/', pageController.getHomePage);
router.get('/login', pageController.getLoginPage);

// --- Student-context pages (rendered server-side with studentCard partial) ---
router.get('/createTicket/:id', fetchStudentMiddleware, pageController.getCreateTicketPage);
router.get('/studentViewTicket/:id', fetchStudentByTicketIdMiddleware, (req, res) =>
    res.render('studentCard')
);
router.get('/secretaryViewTicket/:id', fetchStudentByTicketIdMiddleware, (req, res) =>
    res.render('studentCard')
);

export default router;
