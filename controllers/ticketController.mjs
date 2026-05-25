// Re-export hub for the feature-split ticket controllers.
// Kept for backwards compatibility with any code that still imports from
// `../controllers/ticketController.mjs`. New code should import directly from
// the feature controllers under `controllers/ticket/*`.

export {
    renderCreateTicketPage,
    renderSecretaryCreateTicketPage,
    searchStudents,
    submitCreateTicket,
} from './ticket/createController.mjs';

export {
    renderStudentViewTicketPage,
    renderSecretaryViewTicketPage,
    renderLeaderViewTicketPage,
} from './ticket/viewController.mjs';

export {
    submitSecretaryReply,
    submitSecretaryInternalMessage,
    submitStudentReply,
} from './ticket/replyController.mjs';

export {
    assignTicket,
    submitLeaderAccept,
    submitLeaderReject,
    clearDuplicateFiles,
} from './ticket/leaderActionsController.mjs';

export {
    getUserTickets,
    getSecretaryTickets,
    getLeaderTickets,
    renderUnassignedTicketModal,
    getTicketDetailsAPI,
    searchTickets,
} from './ticket/dashboardController.mjs';

// Backwards-compat aliases — fetch* middlewares now live in middlewares/ticketContext.mjs
export {
    fetchStudentByTicketIdMiddleware,
    fetchStudentMiddleware,
} from '../middlewares/ticketContext.mjs';
