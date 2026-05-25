import * as db from '../../model/db.js';
import { buildStudent, buildStudentSearchResult } from '../../utils/studentFormat.mjs';
import { saveAttachmentsForMessage } from '../../services/attachmentService.mjs';
import { createOptions, isLeaderUser, isSecretaryUser } from './helpers.mjs';

export const renderCreateTicketPage = async (req, res) => {
    try {
        const student_id = Number(req.params.student_id);
        if (!Number.isInteger(student_id) || student_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }
        const row = await db.getStudentInfo(student_id);
        if (!row) {
            return res.status(404).send('Δεν βρέθηκε ο φοιτητής');
        }
        res.render('pages/createTicket', {
            title: 'Νέο Αίτημα',
            student: buildStudent(row),
            studentId: student_id,
            groupedCategories: await createOptions(),
        });
    } catch (error) {
        console.error('Error rendering create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const renderSecretaryCreateTicketPage = async (req, res) => {
    try {
        if (!req.user?.secretary_id) {
            return res.status(403).send('Μη εξουσιοδοτημένη πρόσβαση');
        }

        const isLeader = isLeaderUser(req.user);

        res.render('pages/createTicketSec', {
            title: 'Νέο Αίτημα - Γραμματεία',
            bodyClass: 'secretary-create-ticket-page',
            groupedCategories: await createOptions(),
            isSecretary: !isLeader,
            isLeader,
        });
    } catch (error) {
        console.error('Error rendering secretary create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const searchStudents = async (req, res) => {
    try {
        if (!isSecretaryUser(req.user)) {
            return res.status(403).json({ success: false, message: 'Μη εξουσιοδοτημένη πρόσβαση' });
        }

        const term = String(req.query.q || '').trim();
        if (term.length < 2) {
            return res.json({ success: true, results: [] });
        }

        const rows = await db.searchStudents(term);
        return res.json({
            success: true,
            results: rows.map(buildStudentSearchResult).filter(Boolean),
        });
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ success: false, message: 'Σφάλμα αναζήτησης φοιτητών' });
    }
};

export const submitCreateTicket = async (req, res) => {
    try {
        const { subject, description, category_id } = req.body;
        const files = req.files;
        const studentIdValue = req.params.student_id || req.body.for_student_id;
        const student_id = Number(studentIdValue);
        const isSecretaryFlow = !req.params.student_id && Boolean(req.body.for_student_id);

        if (!Number.isInteger(student_id) || student_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }
        if (!category_id || category_id === 'undefined' || category_id === 'null') {
            return res.status(400).send('Επιλέξτε κατηγορία αιτήματος');
        }
        if (!subject?.trim() || !description?.trim()) {
            return res.status(400).send('Συμπληρώστε όλα τα υποχρεωτικά πεδία');
        }

        // MESSAGE.for_user_id is a FK to USER.user_id, not STUDENT.student_id.
        // We must look up the student's underlying user_id before inserting,
        // otherwise the first message gets attributed to an unrelated user
        // (or to nobody) and the conversation view later misclassifies it.
        const studentRow = await db.getStudentInfo(student_id);
        if (!studentRow) {
            return res.status(404).send('Δεν βρέθηκε ο φοιτητής');
        }

        const ticket_id = await db.insertTicket({
            created_at: new Date(),
            for_student_id: student_id,
            for_category_id: category_id,
        });

        const message_id = await db.insertMessage({
            message_subject: subject.trim(),
            message_description: description.trim(),
            created_at: new Date(),
            for_user_id: studentRow.user_id,
            for_ticket_id: ticket_id,
        });

        await saveAttachmentsForMessage(message_id, files);

        if (isSecretaryFlow) {
            return res.redirect('/secretary_viewtickets');
        }
        return res.redirect(`/tickets/create-ticket/student/${student_id}`);
    } catch (error) {
        console.error('Error submitting create ticket:', error);
        res.status(500).send('Upload failed: ' + error.message);
    }
};
