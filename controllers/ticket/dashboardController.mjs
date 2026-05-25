import dbPool, * as db from '../../model/db.js';
import * as queries from '../../model/queries.mjs';
import { formatTicketRow } from '../../utils/ticketFormat.mjs';
import { formatDateToGreek } from '../../utils/dateFormat.mjs';
import { mapTicketStatus } from '../../utils/statusMap.mjs';
import { formatAttachment } from '../../utils/attachmentFormat.mjs';
import { isLeaderUser, isSecretaryUser } from './helpers.mjs';

export const getUserTickets = async (req, res) => {
    try {
        if (!req.user?.student_id) return res.status(403).send('Μόνο για φοιτητές');

        const [rows] = await dbPool.execute(queries.getTicketsByStudentId, [req.user.student_id]);
        const myTickets = rows.map(formatTicketRow);

        return res.render('pages/viewtickets', {
            title: 'Τα Αιτήματά μου',
            bodyClass: 'ticket-list',
            isStudent: true,
            isSecretary: false,
            isLeader: false,
            studentId: req.user.student_id,
            myTickets,
        });
    } catch (error) {
        console.error('Error loading user tickets:', error);
        return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
    }
};

export const getSecretaryTickets = async (req, res) => {
    try {
        if (!req.user.secretary_id) {
            return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για τη Γραμματεία');
        }

        if (isLeaderUser(req.user)) {
            return res.redirect('/leader_viewtickets');
        }

        const userId = req.user.user_id || req.user.id;
        const [unassignedRows] = await dbPool.execute(queries.getUnassignedTickets);
        const [myRows] = await dbPool.execute(queries.getTicketsBySecretaryId, [userId]);

        return res.render('pages/viewtickets', {
            title: 'Πίνακας Ελέγχου - Γραμματεία',
            bodyClass: 'ticket-list',
            isStudent: false,
            isSecretary: true,
            isLeader: false,
            unassignedTickets: unassignedRows.map(formatTicketRow),
            myTickets: myRows.map(formatTicketRow),
        });
    } catch (error) {
        console.error('Σφάλμα φόρτωσης:', error);
        return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
    }
};

export const getLeaderTickets = async (req, res) => {
    try {
        if (!req.user.secretary_id || !isLeaderUser(req.user)) {
            return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για τον Προϊστάμενο');
        }

        const userId = req.user.user_id || req.user.id;
        const [unassignedRows] = await dbPool.execute(queries.getUnassignedTickets);
        const [myRows] = await dbPool.execute(queries.getTicketsBySecretaryId, [userId]);
        const [escalatedRows] = await dbPool.execute(queries.getEscalatedTickets);
        const [allAssignedRows] = await dbPool.execute(queries.getAllAssignedTicketsForLeader);

        const leaderDisplayName =
            [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || 'Προϊστάμενος';

        return res.render('pages/viewtickets', {
            title: 'Πίνακας Ελέγχου - Προϊστάμενος',
            bodyClass: 'ticket-list',
            isStudent: false,
            isSecretary: false,
            isLeader: true,
            unassignedTickets: unassignedRows.map(formatTicketRow),
            myTickets: myRows.map(formatTicketRow),
            escalatedTickets: escalatedRows.map(formatTicketRow),
            allAssignedTickets: allAssignedRows.map(formatTicketRow),
            secretaries: await db.getSecretariesForAssignment(),
            leaderSecretaryId: req.user.secretary_id,
            leaderDisplayName,
        });
    } catch (error) {
        console.error('Σφάλμα φόρτωσης:', error);
        return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
    }
};

// The modal templates render an empty shell that is populated client-side via
// the /api/ticket/:id endpoint, so we only need to validate access here.
export const renderUnassignedTicketModal = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);
        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        if (!req.user?.secretary_id) {
            return res.status(403).send('Η προβολή είναι διαθέσιμη μόνο για γραμματεία ή προϊστάμενο');
        }

        if (isLeaderUser(req.user)) {
            return res.render('pages/modalLeader', { layout: false });
        }
        return res.render('pages/modalGen', { layout: false });
    } catch (error) {
        console.error('Error loading unassigned ticket modal:', error);
        return res.status(500).send('Σφάλμα κατά τη φόρτωση του αιτήματος');
    }
};

export const getTicketDetailsAPI = async (req, res) => {
    try {
        const ticketId = req.params.id;

        const [msgRows] = await dbPool.execute(queries.getFirstMessageByTicketId, [ticketId]);
        const message = msgRows[0] || null;

        const [studentRows] = await dbPool.execute(queries.getStudentInfoByTicketId, [ticketId]);
        const student = studentRows[0] || null;

        const [catRows] = await dbPool.execute(queries.getCategoryThemeByTicketId, [ticketId]);
        const categoryTheme = catRows[0] || null;

        let attachments = [];
        if (message) {
            const [attRows] = await dbPool.execute(queries.getAttachmentsByMessageId, [
                message.message_id,
            ]);
            attachments = attRows.map(formatAttachment);
        }

        const [internalRows] = await dbPool.execute(queries.getInternalMessageByTicketId, [ticketId]);
        const internalMessage = internalRows[0] || null;

        const isLeader = isLeaderUser(req.user);
        let secretaries = [];
        let leaderSecretaryId = null;
        let leaderDisplayName = null;

        if (isLeader && req.user?.secretary_id) {
            secretaries = await db.getSecretariesForAssignment();
            leaderSecretaryId = req.user.secretary_id;
            leaderDisplayName =
                [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() ||
                'Προϊστάμενος';
        }

        res.json({
            success: true,
            ticketId,
            subject: message?.message_subject || '-',
            description: message?.message_description || '-',
            category: categoryTheme?.category_theme || categoryTheme?.category_name || '-',
            studentName: student ? `${student.first_name} ${student.last_name}` : '-',
            studentAm: student?.student_am || '-',
            studentEmail: student?.email || '-',
            enrollmentYear: student?.enrollment_year || '-',
            date: message?.created_at ? formatDateToGreek(message.created_at) : '-',
            attachments,
            internalMessage: internalMessage
                ? {
                      author: `${internalMessage.first_name} ${internalMessage.last_name}`,
                      text: internalMessage.message_description,
                  }
                : null,
            secretaries,
            leaderSecretaryId,
            leaderDisplayName,
        });
    } catch (error) {
        console.error('Σφάλμα API Modal:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

export const searchTickets = async (req, res) => {
    try {
        if (!isSecretaryUser(req.user)) {
            return res.status(403).json({ success: false, message: 'Μη εξουσιοδοτημένη πρόσβαση' });
        }

        const term = String(req.query.q || '').trim();
        if (term.length < 1) return res.json({ success: true, results: [] });

        const rows = await db.searchTicketsByStudentTerm(term);
        const results = rows.map((r) => ({
            id: r.ticket_id,
            subject: r.subject,
            submittedAt: formatDateToGreek(r.created_at),
            status: mapTicketStatus(r.status).label,
            am: r.student_am,
            studentName: `${r.first_name} ${r.last_name}`,
        }));

        return res.json({ success: true, results });
    } catch (error) {
        console.error('Error searching tickets:', error);
        return res.status(500).json({ success: false, message: 'Σφάλμα αναζήτησης' });
    }
};
