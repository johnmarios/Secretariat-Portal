import express from 'express';

import * as createController from '../controllers/ticket/createController.mjs';
import * as viewController from '../controllers/ticket/viewController.mjs';
import * as replyController from '../controllers/ticket/replyController.mjs';
import * as leaderActions from '../controllers/ticket/leaderActionsController.mjs';
import * as dashboardController from '../controllers/ticket/dashboardController.mjs';

import { ensureAuthenticated } from '../middlewares/authMiddleware.mjs';
import { uploadFiles } from '../middlewares/upload.mjs';

const router = express.Router();

// ----- Create ticket -----
router.get('/create-ticket/student/:student_id', ensureAuthenticated, createController.renderCreateTicketPage);
router.post('/create-ticket/student/:student_id', ensureAuthenticated, uploadFiles, createController.submitCreateTicket);
router.get('/create-ticket/secretary', ensureAuthenticated, createController.renderSecretaryCreateTicketPage);
router.post('/create-ticket/secretary', ensureAuthenticated, uploadFiles, createController.submitCreateTicket);

// ----- Search (JSON) -----
router.get('/students/search', ensureAuthenticated, createController.searchStudents);
router.get('/search', ensureAuthenticated, dashboardController.searchTickets);

// ----- View ticket pages -----
router.get('/student-view-ticket/ticket/:ticket_id', ensureAuthenticated, viewController.renderStudentViewTicketPage);
router.get('/secretary-view-ticket/ticket/:ticket_id', ensureAuthenticated, viewController.renderSecretaryViewTicketPage);
router.get('/leader-view-ticket/ticket/:ticket_id', ensureAuthenticated, viewController.renderLeaderViewTicketPage);

// ----- Modal shells (rendered without layout, populated via /api/ticket/:id) -----
router.get('/unassigned-ticket-modal/:ticket_id', ensureAuthenticated, dashboardController.renderUnassignedTicketModal);
router.get('/leader-unassigned-ticket-modal/:ticket_id', ensureAuthenticated, dashboardController.renderUnassignedTicketModal);

// ----- Replies -----
router.post('/student-view-ticket/ticket/:ticket_id/reply', ensureAuthenticated, uploadFiles, replyController.submitStudentReply);

router.post('/secretary-view-ticket/ticket/:ticket_id/reply', ensureAuthenticated, uploadFiles, replyController.submitSecretaryReply);
router.post('/secretary-view-ticket/ticket/:ticket_id/escalate', ensureAuthenticated, uploadFiles, replyController.submitSecretaryInternalMessage);

// ----- Leader-only escalation actions -----
router.post('/leader-view-ticket/ticket/:ticket_id/accept', ensureAuthenticated, leaderActions.submitLeaderAccept);
router.post('/leader-view-ticket/ticket/:ticket_id/reject', ensureAuthenticated, leaderActions.submitLeaderReject);

// ----- Admin -----
router.get('/clear-duplicate-uploads/', ensureAuthenticated, leaderActions.clearDuplicateFiles);

export default router;
