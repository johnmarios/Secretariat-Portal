import express from 'express';
import * as dashboardController from '../controllers/ticket/dashboardController.mjs';
import * as leaderActions from '../controllers/ticket/leaderActionsController.mjs';
import { ensureAuthenticated } from '../middlewares/authMiddleware.mjs';

const router = express.Router();

// Dashboards
router.get('/student-viewtickets', ensureAuthenticated, dashboardController.getStudentTickets);
router.get('/secretary-viewtickets', ensureAuthenticated, dashboardController.getSecretaryTickets);
router.get('/leader-viewtickets', ensureAuthenticated, dashboardController.getLeaderTickets);

// JSON endpoint used by the dashboard modal
router.get('/api/ticket/:id', ensureAuthenticated, dashboardController.getTicketDetailsAPI);

router.post('/tickets/assign/:id', ensureAuthenticated, leaderActions.assignTicket);

router.post('/tickets/escalated/accept/:ticket_id', ensureAuthenticated, leaderActions.submitLeaderAccept);
router.post('/tickets/escalated/reject/:ticket_id', ensureAuthenticated, leaderActions.submitLeaderReject);

export default router;
