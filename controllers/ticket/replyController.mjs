import dbPool, * as db from '../../model/db.js';
import * as queries from '../../model/queries.mjs';
import { saveAttachmentsForMessage } from '../../services/attachmentService.mjs';

const parseTicketId = (req, res) => {
    const ticket_id = Number(req.params.ticket_id);
    if (!Number.isInteger(ticket_id) || ticket_id < 1) {
        res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        return null;
    }
    return ticket_id;
};

export const submitSecretaryReply = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        const ticket = await db.getTicketById(ticket_id);
        if (!ticket) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const replyText = String(req.body.replyText || '').trim();
        const files = req.files;
        const secretaryUserId = Number(req.body.secretary_id || ticket.for_secretary_id);
        const newStatus = req.body.status;

        if (!replyText && !newStatus) {
            return res.status(400).send('Συμπληρώστε την απάντηση ή επιλέξτε νέα κατάσταση');
        }
        if (!Number.isInteger(secretaryUserId) || secretaryUserId < 1) {
            return res.status(409).send('Το αίτημα δεν έχει ανατεθεί ακόμη σε γραμματεία');
        }

        if (newStatus) {
            try {
                await dbPool.execute(queries.updateTicketStatusById, [newStatus, ticket_id]);
            } catch (err) {
                console.error('Error updating ticket status:', err);
                return res.status(500).send('Αποτυχία ενημέρωσης κατάστασης');
            }
        }

        if (replyText) {
            const message_id = await db.insertMessage({
                message_subject: null,
                message_description: replyText,
                created_at: new Date(),
                for_user_id: secretaryUserId,
                for_ticket_id: ticket_id,
            });
            await saveAttachmentsForMessage(message_id, files);
        }

        return res.redirect('/secretary-viewtickets');
    } catch (error) {
        console.error('Error submitting secretary reply:', error);
        return res.status(500).send('Reply failed: ' + error.message);
    }
};

export const submitSecretaryInternalMessage = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        const ticket = await db.getTicketById(ticket_id);
        if (!ticket) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const internalText = String(req.body.internalText || '').trim();
        const files = req.files;
        const authorUserId = req.user?.user_id || req.user?.id;

        if (!internalText) {
            return res.status(400).send('Συμπληρώστε το εσωτερικό μήνυμα');
        }

        const message_id = await db.insertInternalMessage({
            message_subject: null,
            message_description: internalText,
            created_at: new Date(),
            for_user_id: authorUserId,
            for_ticket_id: ticket_id,
        });

        await saveAttachmentsForMessage(message_id, files);

        if (req.body.escalate === '1') {
            try {
                await dbPool.execute(queries.setTicketEscalatedFlag, [1, ticket_id]);
            } catch (err) {
                console.error('Error setting escalated flag:', err);
            }
        }

        return res.redirect('/secretary-viewtickets');
    } catch (error) {
        console.error('Error submitting internal message:', error);
        return res.status(500).send('Internal message failed: ' + error.message);
    }
};

export const submitStudentReply = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const replyText = req.body.replyText?.trim();
        const files = req.files;

        if (!replyText) return res.status(400).send('Συμπληρώστε το μήνυμα πριν την αποστολή');

        const message_id = await db.insertMessage({
            message_subject: null,
            message_description: replyText,
            created_at: new Date(),
            for_user_id: studentRow.user_id,
            for_ticket_id: ticket_id,
        });

        await saveAttachmentsForMessage(message_id, files);

        return res.redirect(`/tickets/student-view-ticket/ticket/${ticket_id}`);
    } catch (error) {
        console.error('Error submitting student reply:', error);
        return res.status(500).send('Submit failed: ' + error.message);
    }
};
