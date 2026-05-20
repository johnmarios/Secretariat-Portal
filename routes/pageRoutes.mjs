import express from 'express';
// Κάνουμε import όλες τις συναρτήσεις από τους controllers
import * as pageController from '../controllers/pageController.mjs';
import * as ticketController from '../controllers/ticketController.mjs';
// Το auth.js ίσως χρειαστεί να το κάνεις export const ensureAuthenticated = ... για να το τραβάς έτσι:
import { ensureAuthenticated } from '../middlewares/authMiddleware.mjs'; 

const router = express.Router();

// --- Public Σελίδες ---
router.get('/', pageController.getHomePage);
router.get('/login', pageController.getLoginPage);

// --- Φοιτητές ---
router.get('/user_viewtickets', ensureAuthenticated, ticketController.getUserTickets);
router.get('/createTicket/:id', ticketController.fetchStudentMiddleware, pageController.getCreateTicketPage);
router.get('/studentViewTicket/:id', ticketController.fetchStudentByTicketIdMiddleware, (req, res) => res.render('studentCard'));

// --- Γραμματεία & Προϊστάμενος ---
router.get('/secretary_viewtickets', ensureAuthenticated, ticketController.getSecretaryTickets);
router.get('/leader_viewtickets', ensureAuthenticated, ticketController.getLeaderTickets);
router.get('/secretary_createTicket', ensureAuthenticated, ticketController.renderSecretaryCreateTicketPage);
router.get('/secretaryViewTicket/:id', ticketController.fetchStudentByTicketIdMiddleware, (req, res) => res.render('studentCard'));

// --- Actions (POST) ---
router.post('/tickets/assign/:id', ensureAuthenticated, ticketController.assignTicket);

// Exporting το router σε .mjs
export default router;