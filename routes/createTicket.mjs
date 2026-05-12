import express from 'express';
import * as ticketController from '../controllers/ticketController.mjs';

const router = express.Router();

router.get('/create-ticket/:student_id', ticketController.renderCreateTicketPage);
// router.post('/create-ticket/:student_id', ticketController.submitCreateTicket);

export default router;