const express = require('express');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Η σελίδα που βλέπει ο χρήστης (GET)
router.get('/create-ticket/:student_id', ticketController.renderCreateTicketPage);
// router.post('/create-ticket/:student_id', ticketController.submitCreateTicket);


// Η διαδρομή που στέλνει η φόρμα τα δεδομένα (POST)
// router.post('/tickets/create', ticketController.submitCreateTicket);

module.exports = router;