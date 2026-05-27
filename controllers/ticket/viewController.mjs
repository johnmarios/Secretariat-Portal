import * as db from '../../model/db.js';
import { buildStudent } from '../../utils/studentFormat.mjs';
import { mapTicketStatus } from '../../utils/statusMap.mjs';
import { formatUserDisplayName } from '../../utils/displayName.mjs';
import { buildTicketConversation } from '../../services/conversationService.mjs';
import { isLeaderUser } from './helpers.mjs';

const parseTicketId = (req, res) => {
    const ticket_id = Number(req.params.ticket_id);
    if (!Number.isInteger(ticket_id) || ticket_id < 1) {
        res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        return null;
    }
    return ticket_id;
};

const loadTicketHeader = async (ticket_id) => {
    const categoryTheme = await db.getCategoryThemeByTicketId(ticket_id);
    const ticketRow = await db.getTicketById(ticket_id);
    const ticketStatusRaw = ticketRow?.status || null;
    const ticketStatusMapped = ticketStatusRaw
        ? mapTicketStatus(ticketStatusRaw)
        : { label: '-', className: 'status-default' };

    return {
        categoryTheme,
        category_name: categoryTheme?.category_theme || '-',
        ticketStatusRaw,
        ticketStatusMapped,
    };
};

export const renderStudentViewTicketPage = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const header = await loadTicketHeader(ticket_id);
        const conversation = await buildTicketConversation(ticket_id, studentRow);
        if (!conversation) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        res.render('pages/studentViewTicket', {
            title: 'Το Αίτημά μου',
            ticket_id,
            ticket: { status: header.ticketStatusMapped },
            category_name: header.category_name,
            student: buildStudent(studentRow),
            studentId: studentRow.student_id,
            firstMessage: conversation.firstMessage,
            firstMessageAttachments: conversation.firstMessageAttachments,
            isStudent: true,
            isSecretary: false,
            isLeader: false,
            messages: conversation.messages,
            messagesCount: conversation.messagesCount,
        });
    } catch (error) {
        console.error('Error rendering student view ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const renderSecretaryViewTicketPage = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα ή ο φοιτητής');

        const header = await loadTicketHeader(ticket_id);
        const conversation = await buildTicketConversation(ticket_id, studentRow);
        if (!conversation) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        res.render('pages/secretaryViewTicket', {
            title: 'Λεπτομέρειες Αιτήματος',
            ticket_id,
            ticket: { status: header.ticketStatusMapped },
            ticketStatusRaw: header.ticketStatusRaw,
            categoryTheme: header.categoryTheme,
            category_name: header.category_name,
            student: buildStudent(studentRow),
            studentId: studentRow.student_id,
            firstMessage: conversation.firstMessage,
            firstMessageAttachments: conversation.firstMessageAttachments,
            isStudent: false,
            isSecretary: true,
            isLeader: false,
            messages: conversation.messages,
            messagesCount: conversation.messagesCount,
        });
    } catch (error) {
        console.error('Error rendering secretary view ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const renderLeaderViewTicketPage = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        if (!req.user?.secretary_id || !isLeaderUser(req.user)) {
            return res.status(403).send('Η προβολή είναι διαθέσιμη μόνο για τον προϊστάμενο');
        }

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα ή ο φοιτητής');

        const header = await loadTicketHeader(ticket_id);
        const conversation = await buildTicketConversation(ticket_id, studentRow);
        if (!conversation) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        return res.render('pages/leaderViewTicket', {
            title: 'Λεπτομέρειες Αιτήματος - Προϊστάμενος',
            ticket_id,
            ticket: { status: header.ticketStatusMapped },
            ticketStatusRaw: header.ticketStatusRaw,
            categoryTheme: header.categoryTheme,
            category_name: header.category_name,
            student: buildStudent(studentRow),
            studentId: studentRow.student_id,
            firstMessage: conversation.firstMessage,
            firstMessageAttachments: conversation.firstMessageAttachments,
            isStudent: false,
            isSecretary: false,
            isLeader: true,
            messages: conversation.messages,
            messagesCount: conversation.messagesCount,
            secretaries: await db.getSecretariesForAssignment(),
            leaderSecretaryId: req.user.secretary_id,
            leaderDisplayName: formatUserDisplayName(req.user, 'Προϊστάμενος'),
        });
    } catch (error) {
        console.error('Error rendering leader view ticket page:', error);
        return res.status(500).send('Internal Server Error');
    }
};
