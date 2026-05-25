import express from 'express';
import * as dashboardController from '../controllers/ticket/dashboardController.mjs';
import * as leaderActions from '../controllers/ticket/leaderActionsController.mjs';
import { ensureAuthenticated } from '../middlewares/authMiddleware.mjs';

const router = express.Router();

// Dashboards
router.get('/user_viewtickets', ensureAuthenticated, dashboardController.getUserTickets);
router.get('/secretary_viewtickets', ensureAuthenticated, dashboardController.getSecretaryTickets);
router.get('/leader_viewtickets', ensureAuthenticated, dashboardController.getLeaderTickets);

// JSON endpoint used by the dashboard modal
router.get('/api/ticket/:id', ensureAuthenticated, dashboardController.getTicketDetailsAPI);

// Legacy assignment endpoint kept at /tickets/assign/:id for compatibility
router.post('/tickets/assign/:id', ensureAuthenticated, leaderActions.assignTicket);

// Legacy escalated accept/reject endpoints — same handler as the leader-view forms
router.post('/tickets/escalated/accept/:ticket_id', ensureAuthenticated, leaderActions.submitLeaderAccept);
router.post('/tickets/escalated/reject/:ticket_id', ensureAuthenticated, leaderActions.submitLeaderReject);

export default router;
