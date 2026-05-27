import fs from 'node:fs';
import path from 'node:path';
import dbPool from '../../model/db.js';
import * as queries from '../../model/queries.mjs';
import { isLeaderUser } from './helpers.mjs';

const parseTicketId = (req, res) => {
    const ticket_id = Number(req.params.ticket_id);
    if (!Number.isInteger(ticket_id) || ticket_id < 1) {
        res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        return null;
    }
    return ticket_id;
};

const finalizeEscalation = async ({ ticketId, newStatus, logLabel, assignSecretaryId = null }) => {
    const conn = await dbPool.getConnection();
    try {
        
        // need to update the ticket status to pending or in_progress depending on the action (reject or accept)
        // and then delete the internal messages and their attachments that were created for the escalation;

        await conn.beginTransaction();
        // wrap the delete and update operations in a transaction to ensure data integrity;
        // if any of the operations fail, we can roll back to the previous consistent state

        const [attachmentRows] = await conn.execute(
            queries.getAttachmentFilePathsForInternalMessagesByTicketId,
            [ticketId]
        );

        const [delAttRes] = await conn.execute(queries.deleteAttachmentsForInternalMessages, [ticketId]);
        const [delMsgRes] = await conn.execute(queries.deleteInternalMessagesByTicketId, [ticketId]);
        let updRes;
        if (assignSecretaryId) {
            [updRes] = await conn.execute(queries.updateTicketStatusWithSecretary, [
                newStatus,
                assignSecretaryId,
                ticketId,
            ]);
        } else {
            [updRes] = await conn.execute(queries.updateTicketStatusById, [newStatus, ticketId]);
        }

        await conn.commit();

        for (const row of attachmentRows) {
            try {
                const p = row.file_path || row.filePath || row.fileName;
                if (!p) continue;
                const full = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
                if (fs.existsSync(full)) fs.unlinkSync(full);
            } catch (e) {
                console.warn('Failed to delete attachment file:', e.message);
            }
        }

        console.log(
            `${logLabel} ticket ${ticketId}: deleted attachments=${delAttRes.affectedRows}, messages=${delMsgRes.affectedRows}, updated=${updRes.affectedRows}`
        );
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

export const assignTicket = async (req, res) => {
    // changes status and becomes in progress 
    const ticketId = req.params.id;
    const selectedSecretaryId = Number(req.body.secretary_id || req.user.secretary_id);
    if (!Number.isInteger(selectedSecretaryId) || selectedSecretaryId < 1) {
        return res.status(400).send('Μη έγκυρη ανάθεση γραμματέα');
    }

    try {
        await dbPool.execute(queries.updateTicketStatusWithSecretary, ['in_progress', selectedSecretaryId, ticketId]);

        if (isLeaderUser(req.user)) {
            return res.redirect('/leader-viewtickets');
        }
        return res.redirect('/secretary-viewtickets');
    } catch (error) {
        console.error('Σφάλμα κατά την ανάληψη:', error);
        res.status(500).send('Αποτυχία ανάληψης αιτήματος.');
    }
};

export const submitLeaderAccept = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        await finalizeEscalation({
            ticketId: ticket_id,
            newStatus: 'in_progress',
            logLabel: 'Leader accepted',
            assignSecretaryId: req.user?.secretary_id || null,
        });
        return res.redirect('/leader-viewtickets');
    } catch (err) {
        console.error('Error accepting escalated ticket:', err);
        return res.status(500).send('Operation failed');
    }
};

export const submitLeaderReject = async (req, res) => {
    try {
        const ticket_id = parseTicketId(req, res);
        if (ticket_id === null) return;

        await finalizeEscalation({
            ticketId: ticket_id,
            newStatus: 'pending',
            logLabel: 'Leader rejected',
        });
        return res.redirect('/leader-viewtickets');
    } catch (err) {
        console.error('Error rejecting escalated ticket:', err);
        return res.status(500).send('Operation failed');
    }
};

const getFilesFromFolder = () => {
    const directoryPath = path.join(process.cwd(), 'public', 'files');
    if (!fs.existsSync(directoryPath)) return [];
    return fs.readdirSync(directoryPath).map((fileName) => ({
        fileName,
        filePath: path.join(directoryPath, fileName),
    }));
};

export const clearDuplicateFiles = async (req, res) => {
    try {
        const files = getFilesFromFolder();
        const seen = new Map();
        const deletedFiles = [];

        for (const file of files) {
            const stats = fs.statSync(file.filePath);
            const canonicalName = file.fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1');
            const duplicateKey = `${canonicalName}-${stats.size}`;

            if (seen.has(duplicateKey)) {
                fs.unlinkSync(file.filePath);
                deletedFiles.push(file.fileName);
            } else {
                seen.set(duplicateKey, true);
            }
        }

        return res.json({
            ok: true,
            scanned: files.length,
            deleted: deletedFiles.length,
            deletedFiles,
        });
    } catch (error) {
        console.error('Error clearing duplicate files:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
};
