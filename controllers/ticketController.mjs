import fs from 'fs';
import path from 'path';
import * as db from '../model/db.js';

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
        //student_id, full name, am, email, study_year, submitted_at
        res.render('createTicket', {
            title: 'Νέο Αίτημα',
            student: buildStudent(row), 
            studentId: student_id,
            groupedCategories: await createOptions()
        });
    } catch (error) {
        console.error('Error rendering create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

let buildStudent = (row) => {
    if (!row) return null;
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim(); 
    // subtracts from the array any falsy values (null, undefined, empty string)
    //  and then joins the remaining parts with a space and trims any extra whitespace

    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear(); 
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);

    const am = row.student_am;
    const email = row.email;
    // const submittedAt = new Date().toLocaleDateString('el-GR');
    return {
        fullName,
        studentAm: am,
        email,
        studyYear: String(studyYear)
        // submittedAt
    };
}

let createOptions = async () => {
    // purpose is to fetch flatCategories: [
    //     { id, theme, name },
    //     ...
    // ]
    // then group them by theme into groupedCategories: [
    //     { 
    //        themeName, 
    //        options: [
    //          { id, name, selected }, ...
    //        ] 
    //     },
    //     ...
    // ]
 
    const flatCategories = await db.getAllCategories();

    const groupedCategories = flatCategories.reduce((acc, item) => {
        
        let theme = item.category_theme ;
        let displayName = item.category_name ;

        let group = acc.find(g => g.themeName === theme);
        if (!group) {
            group = { themeName: theme, options: [] };
            acc.push(group);
        }

        group.options.push({
            id: String(item.category_id),
            name: displayName,
        });
        return acc;
    }, []);
    return groupedCategories;
};

export const submitCreateTicket = async (req, res) => {
    try {
        const{ subject, description, category_id } = req.body;
        console.log(req.body);
        const files = req.files; // array of uploaded files (if any)
        const student_id = Number(req.params.student_id);

        if (!Number.isInteger(student_id) || student_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }

        if (!category_id) {
            return res.status(400).send('Επιλέξτε κατηγορία αιτήματος');
        }

        if (!subject?.trim() || !description?.trim()) {
            return res.status(400).send('Συμπληρώστε όλα τα υποχρεωτικά πεδία');
        }

        //save ticket info to the database
        const ticket_id = await db.insertTicket({
            created_at: new Date(),
            for_student_id: student_id,
            for_category_id: category_id
        });

        const message_id = await db.insertMessage({
            message_subject: subject.trim(),
            message_description: description.trim(),
            created_at: new Date(),
            for_user_id: student_id,
            for_ticket_id: ticket_id
        });
        // save file paths to the database, into attachments table
        if (files && files.length > 0) {
            for (let file of files) {
                await db.saveAttachment({
                    file_path: file.path,
                    file_name: file.originalname,
                    file_size: file.size,
                    file_type: file.mimetype,
                    file_id: file.filename,
                    for_message_id: message_id
                });
            }
        }
        res.redirect(`/tickets/create-ticket/student/${student_id}`);
    } catch (error) {
        console.error('Error submitting create ticket:', error);
        res.status(500).send("Upload failed: " + error.message);
    }
};

export const renderSecretaryViewTicketPage = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);

        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) {
            return res.status(404).send('Δεν βρέθηκε το αίτημα ή ο φοιτητής');
        }

        const firstMessage = await db.getFirstMessageByTicketId(ticket_id);
        const categoryTheme = await db.getCategoryThemeByTicketId(ticket_id);
        // db returns { category_theme: '...' } 
        const category_name = categoryTheme.category_theme;
        // const restStudentMessages = await db.getRestStudentMessagesByTicketId(ticket_id);
        // first message filelist: 
        const firstMessageAttachments = await db.getAttachmentsByMessageId(firstMessage.message_id);

        // get all messages of the ticket, except of the first one,
        // ordered by message_id ascending, and for each message get its attachments,
        //  then combine them into a single array of messages with attachments
        // format the messages to include a bubbleClass property based on the sender (student or secretary)
        const restStudentMessages = await db.getRestStudentMessagesByTicketId(ticket_id);
        const secretaryMessages = await db.getSecretaryMessagesByTicketId(ticket_id);
        const allMessages = [...restStudentMessages, ...secretaryMessages].sort((a, b) => a.message_id - b.message_id);
        const messageIds = allMessages.map(m => m.message_id);

        const allAttachments = await db.getAttachmentsByMessagesId(messageIds);
        // for quick access i create a map
        const attachmentsMap = new Map();
        allAttachments.forEach(att => {
            // if the map doesn't have an entry for the message id, create an empty array
            if (!attachmentsMap.has(att.for_message_id)) {
                attachmentsMap.set(att.for_message_id, []);
            }
            attachmentsMap.get(att.for_message_id).push(att);
        });
        const formattedMessages = allMessages.map(message => ({
            ...message,
            attachments: attachmentsMap.get(message.message_id) || [],
            senderDisplay: message.for_user_id === studentRow.student_id ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
            bubbleClass: message.for_user_id === studentRow.student_id ? 'student-message' : 'staff-message',
            created_at: message.created_at
        }));


        res.render('secretaryViewTicket', {
            title: 'Λεπτομέρειες Αιτήματος',
            ticket_id,
            categoryTheme,
            category_name,
            student: buildStudent(studentRow),
            studentId: studentRow.student_id,
            firstMessage,
            firstMessageAttachments,
            messages: formattedMessages,
            messagesCount: formattedMessages.length + 1
        });
    } catch (error) {
        console.error('Error rendering secretary view ticket page:', error);    
        res.status(500).send('Internal Server Error');
    }
};

const getFilesFromFolder = () => {
    const directoryPath = path.join(process.cwd(), 'public', 'files');
    if (!fs.existsSync(directoryPath)) {
        return [];
    }
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

export const submitSecretaryReply = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);
        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        const ticket = await db.getTicketById(ticket_id);
        if (!ticket) {
            return res.status(404).send('Δεν βρέθηκε το αίτημα');
        }
        console.log(req.body);

        const replyText = req.body.replyText.trim();
        const files = req.files;
        const secretaryUserId = Number(req.body.secretary_id || ticket.for_secretary_id);

        if (!replyText) {
            return res.status(400).send('Συμπληρώστε την απάντηση πριν την αποστολή');
        }

        if (!Number.isInteger(secretaryUserId) || secretaryUserId < 1) {
            return res.status(409).send('Το αίτημα δεν έχει ανατεθεί ακόμη σε γραμματεία');
        }

        const message_id = await db.insertMessage({
            message_subject: null,
            message_description: replyText,
            created_at: new Date(),
            for_user_id: secretaryUserId,
            for_ticket_id: ticket_id
        });

        if (files && files.length > 0) {
            for (const file of files) {
                await db.saveAttachment({
                    file_path: file.path,
                    file_name: file.originalname,
                    file_size: file.size,
                    file_type: file.mimetype,
                    file_id: file.filename,
                    for_message_id: message_id
                });
            }
        }

        return res.redirect(`/tickets/view-secretary-ticket/ticket/${ticket_id}`);
    } catch (error) {
        console.error('Error submitting secretary reply:', error);
        return res.status(500).send('Reply failed: ' + error.message);
    }
};

export const renderStudentViewTicketPage = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);
        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const firstMessage = await db.getFirstMessageByTicketId(ticket_id);
        const firstMessageAttachments = firstMessage ? await db.getAttachmentsByMessageId(firstMessage.message_id) : [];

        const restStudentMessages = await db.getRestStudentMessagesByTicketId(ticket_id);
        const secretaryMessages = await db.getSecretaryMessagesByTicketId(ticket_id);
        const allMessages = [...restStudentMessages, ...secretaryMessages].sort((a, b) => a.message_id - b.message_id);
        const messageIds = allMessages.map(m => m.message_id);

        const allAttachments = messageIds.length ? await db.getAttachmentsByMessagesId(messageIds) : [];
        const attachmentsMap = new Map();
        allAttachments.forEach(att => {
            if (!attachmentsMap.has(att.for_message_id)) attachmentsMap.set(att.for_message_id, []);
            attachmentsMap.get(att.for_message_id).push(att);
        });

        const formattedMessages = allMessages.map(message => ({
            ...message,
            attachments: attachmentsMap.get(message.message_id) || [],
            senderDisplay: message.for_user_id === studentRow.student_id ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
            bubbleClass: message.for_user_id === studentRow.student_id ? 'student-message' : 'staff-message',
            created_at: message.created_at
        }));

        res.render('studentViewTicket', {
            title: 'Το Αίτημά μου',
            ticket_id,
            student: buildStudent(studentRow),
            studentId: studentRow.student_id,
            firstMessage,
            firstMessageAttachments,
            messages: formattedMessages,
            messagesCount: formattedMessages.length + 1
        });
    } catch (error) {
        console.error('Error rendering student view ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const submitStudentReply = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);
        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        const studentRow = await db.getStudentInfoByTicketId(ticket_id);
        if (!studentRow) return res.status(404).send('Δεν βρέθηκε το αίτημα');

        const replyText = req.body.replyText?.trim();
        const files = req.files;

        if (!replyText) return res.status(400).send('Συμπληρώστε το μήνυμα πριν την αποστολή');

        const message_id = await db.insertMessage({
            message_subject: null,
            message_description: replyText,
            created_at: new Date(),
            for_user_id: studentRow.student_id,
            for_ticket_id: ticket_id
        });

        if (files && files.length > 0) {
            for (const file of files) {
                await db.saveAttachment({
                    file_path: file.path,
                    file_name: file.originalname,
                    file_size: file.size,
                    file_type: file.mimetype,
                    file_id: file.filename,
                    for_message_id: message_id
                });
            }
        }

        return res.redirect(`/tickets/student-view-ticket/ticket/${ticket_id}`);
    } catch (error) {
        console.error('Error submitting student reply:', error);
        return res.status(500).send('Submit failed: ' + error.message);
    }
};