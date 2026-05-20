import fs from 'node:fs';
import path from 'node:path';

// ΝΕΟ IMPORT: Παίρνουμε το pool (για σένα) ΚΑΙ τα functions (για τον συνεργάτη)
import dbPool, * as db from '../model/db.js';
import * as queries from '../model/queries.mjs';


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

let buildStudentSearchResult = (row) => {
    if (!row) return null;

    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
    const enrollmentYear = Number(row.enrollment_year);
    const currentYear = new Date().getFullYear();
    const studyYear = Number.isFinite(enrollmentYear)
        ? Math.max(1, currentYear - enrollmentYear + 1)
        : null;

    return {
        studentId: row.student_id,
        fullName,
        studentAm: row.student_am,
        email: row.email,
        studyYear: studyYear ? `${studyYear}ο Έτος Σπουδών` : '-',
        department: 'Ηλεκτρολόγων Μηχανικών και Τεχνολογίας Υπολογιστών'
    };
};

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
        
        let theme = item.theme;
        let displayName = item.name;

        let group = acc.find(g => g.themeName === theme);
        if (!group) {
            group = { themeName: theme, options: [] };
            acc.push(group);
        }

        group.options.push({
            id: String(item.id),
            name: displayName,
        });
        return acc;
    }, []);
    return groupedCategories;
};

const loadUnassignedTicketModalData = async (ticket_id) => {
    const numericTicketId = Number(ticket_id);

    const [unassignedRows] = await dbPool.execute(queries.getUnassignedTickets);
    const ticketRow = unassignedRows.find(row => Number(row.ticket_id) === numericTicketId);
    if (!ticketRow) {
        return null;
    }

    const studentRow = await db.getStudentInfoByTicketId(numericTicketId);
    if (!studentRow) {
        return null;
    }

    const firstMessage = await db.getFirstMessageByTicketId(numericTicketId);
    if (!firstMessage) {
        return null;
    }

    const categoryTheme = await db.getCategoryThemeByTicketId(numericTicketId);
    const firstMessageAttachments = await db.getAttachmentsByMessageId(firstMessage.message_id);

    const restStudentMessages = await db.getRestStudentMessagesByTicketId(numericTicketId);
    const secretaryMessages = await db.getSecretaryMessagesByTicketId(numericTicketId);
    const allMessages = [...restStudentMessages, ...secretaryMessages].sort((a, b) => a.message_id - b.message_id);
    const messageIds = allMessages.map(message => message.message_id);

    const allAttachments = messageIds.length ? await db.getAttachmentsByMessagesId(messageIds) : [];
    const attachmentsMap = new Map();

    allAttachments.forEach(att => {
        if (!attachmentsMap.has(att.for_message_id)) {
            attachmentsMap.set(att.for_message_id, []);
        }
        attachmentsMap.get(att.for_message_id).push(att);
    });

    const formattedMessages = allMessages.map(message => {
        const isFromStudent = Number(message.for_user_id) === Number(studentRow.student_id);
        return {
            ...message,
            attachments: attachmentsMap.get(message.message_id) || [],
            senderDisplay: isFromStudent ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
            bubbleClass: isFromStudent ? 'student-message' : 'staff-message',
            created_at: message.created_at
        };
    });

    return {
        ticket_id: ticketRow.ticket_id,
        ticket: {
            id: ticketRow.ticket_id,
            subject: ticketRow.subject,
            submittedAt: formatDateToGreek(ticketRow.created_at),
            completedAt: formatDateToGreek(ticketRow.resolved_at),
            status: mapTicketStatus(ticketRow.status),
        },
        category_name: categoryTheme?.category_theme || '-',
        student: buildStudent(studentRow),
        studentId: studentRow.student_id,
        firstMessage,
        firstMessageAttachments,
        messages: formattedMessages,
        messagesCount: formattedMessages.length + 1,
    };
};

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

export const renderSecretaryCreateTicketPage = async (req, res) => {
    try {
        const isSecretary = Boolean(req.user?.secretary_id) && (req.user.role === 'secretary' || req.user.role === 'leader');
        if (!isSecretary) {
            return res.status(403).send('Μη εξουσιοδοτημένη πρόσβαση');
        }

        res.render('createTicketSec', {
            title: 'Νέο Αίτημα - Γραμματεία',
            bodyClass: 'secretary-create-ticket-page',
            groupedCategories: await createOptions()
        });
    } catch (error) {
        console.error('Error rendering secretary create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const searchStudents = async (req, res) => {
    try {
        const isSecretary = Boolean(req.user?.secretary_id) && (req.user.role === 'secretary' || req.user.role === 'leader');
        if (!isSecretary) {
            return res.status(403).json({ success: false, message: 'Μη εξουσιοδοτημένη πρόσβαση' });
        }

        const term = String(req.query.q || '').trim();
        if (term.length < 2) {
            return res.json({ success: true, results: [] });
        }

        const rows = await db.searchStudents(term);
        return res.json({
            success: true,
            results: rows.map(buildStudentSearchResult).filter(Boolean)
        });
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ success: false, message: 'Σφάλμα αναζήτησης φοιτητών' });
    }
};

export const submitCreateTicket = async (req, res) => {
    try {
        const{ subject, description, category_id } = req.body;
        console.log(req.body);
        const files = req.files; // array of uploaded files (if any)
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
        if (isSecretaryFlow) {
            return res.redirect('/secretary_viewtickets');
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
        const category_name = categoryTheme?.category_theme || '-';
        // const restStudentMessages = await db.getRestStudentMessagesByTicketId(ticket_id);
        // first message filelist: 
        const firstMessageAttachments = firstMessage
            ? await db.getAttachmentsByMessageId(firstMessage.message_id)
            : [];

        // get all messages of the ticket, except of the first one,
        // ordered by message_id ascending, and for each message get its attachments,
        //  then combine them into a single array of messages with attachments
        // format the messages to include a bubbleClass property based on the sender (student or secretary)
        const restStudentMessages = await db.getRestStudentMessagesByTicketId(ticket_id);
        const secretaryMessages = await db.getSecretaryMessagesByTicketId(ticket_id);
        const allMessages = [...restStudentMessages, ...secretaryMessages].sort((a, b) => a.message_id - b.message_id);
        const messageIds = allMessages.map(m => m.message_id);

        const allAttachments = messageIds.length
            ? await db.getAttachmentsByMessagesId(messageIds)
            : [];
        // for quick access i create a map
        const attachmentsMap = new Map();
        allAttachments.forEach(att => {
            // if the map doesn't have an entry for the message id, create an empty array
            if (!attachmentsMap.has(att.for_message_id)) {
                attachmentsMap.set(att.for_message_id, []);
            }
            attachmentsMap.get(att.for_message_id).push(att);
        });
        const formattedMessages = allMessages.map(message => {
            const isFromStudent = Number(message.for_user_id) === Number(studentRow.student_id);
            return {
                ...message,
                attachments: attachmentsMap.get(message.message_id) || [],
                senderDisplay: isFromStudent ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
                bubbleClass: isFromStudent ? 'student-message' : 'staff-message',
                created_at: message.created_at
            };
        });


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

        return res.redirect(`/tickets/secretary-view-ticket/ticket/${ticket_id}`);
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

        const formattedMessages = allMessages.map(message => {
            const isFromStudent = Number(message.for_user_id) === Number(studentRow.student_id);
            return {
                ...message,
                attachments: attachmentsMap.get(message.message_id) || [],
                senderDisplay: isFromStudent ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
                bubbleClass: isFromStudent ? 'student-message' : 'staff-message',
                created_at: message.created_at
            };
        });

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





// --- Βοηθητικές Συναρτήσεις (Δεν γίνονται export, μένουν εσωτερικές) ---
const mapTicketStatus = (status) => {
    switch (status) {
        case 'open': return { label: 'Μη Εκχωρημένο', className: 'status-open' }; 
        case 'in_progress': return { label: 'Σε Εξέλιξη', className: 'status-in-progress' }; 
        case 'pending': return { label: 'Σε Αναμονή', className: 'status-pending' }; 
        case 'resolved': return { label: 'Resolved', className: 'status-resolved' }; 
        case 'closed': return { label: 'Κλειστό', className: 'status-closed' }; 
        default: return { label: status, className: 'status-default' };
    }
};

const formatDateToGreek = (dateValue) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('el-GR');
};

// --- Middlewares (Ήρθαν από τα Routes) ---
export const fetchStudentByTicketIdMiddleware = async (req, res, next) => {
    try {
        const [rows] = await dbPool.execute(queries.getTicketsByStudentId, [req.user.student_id]);
        if (rows.length === 0) return res.status(404).send("Student not found");

        const studentData = rows[0];
        const studyYear = new Date().getFullYear() - studentData.enrollment_year + 1;

        res.locals.student = {
            fullName: `${studentData.first_name} ${studentData.last_name}`,
            studentAm: studentData.student_am,
            email: studentData.email,
            enrollmentYear: studentData.enrollment_year,
            studyYear: studyYear
        };
        next(); 
    } catch (error) {
        console.error("Error fetching student info:", error);
        res.status(500).send("error fetching student info");
    }
};

export const fetchStudentMiddleware = async (req, res, next) => {
    try {
            const paramId = req.params.id;
            const authStudentId = req.isAuthenticated && req.isAuthenticated() && req.user && req.user.student_id;
            const studentId = paramId || authStudentId;
    
            if (!studentId) return res.redirect('/login');
    
            const [rows] = await dbPool.execute(queries.getStudentInfo, [studentId]);
            if (!rows || rows.length === 0) return res.status(404).send('Student not found');
    
            const studentData = rows[0];
            const currentYear = new Date().getFullYear();
            const studyYear = currentYear - studentData.enrollment_year + 1;
    
            res.locals.student = {
                fullName: `${studentData.first_name} ${studentData.last_name}`,
                studentAm: studentData.student_am,
                email: studentData.email,
                enrollmentYear: studentData.enrollment_year,
                studyYear
            };
    
            next();
        } catch (err) {
            console.error('Error loading createTicket page:', err);
            res.status(500).send('Server error');
        }
    next();
};

// --- Controllers Λειτουργιών ---
export const getUserTickets = async (req, res) => {
    try {
        if (!req.user?.student_id) return res.status(403).send('Μόνο για φοιτητές');

        const [rows] = await dbPool.execute(queries.getTicketsByStudentId, [req.user.student_id]);
        const myTickets = rows.map((ticket) => {
            const mappedStatus = mapTicketStatus(ticket.status);
            return {
                id: ticket.ticket_id,
                subject: ticket.subject,
                submittedAt: formatDateToGreek(ticket.created_at),
                completedAt: formatDateToGreek(ticket.resolved_at),
                status: mappedStatus.label,
                statusClass: mappedStatus.className
            };
        });

        return res.render('viewtickets', {
            title: 'Τα Αιτήματά μου',
            bodyClass: 'ticket-list',
            isStudent: true,    
            studentId: req.user.student_id, 
            myTickets 
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
    
            const isLeader = req.user.role === 'leader' || req.user.is_leader === 1;
            
            // Έξυπνο UX: Αν μπει Προϊστάμενος εδώ κατά λάθος, τον στέλνουμε στο δικό του URL!
            if (isLeader) {
                return res.redirect('/leader_viewtickets');
            }
    
            const userId = req.user.user_id || req.user.id; 
    
            // Τραβάμε ΜΟΝΟ τα δεδομένα που χρειάζεται η απλή γραμματεία
            const [unassignedRows] = await dbPool.execute(queries.getUnassignedTickets);
            const [myRows] = await dbPool.execute(queries.getTicketsBySecretaryId, [userId]);
    
            const unassignedTickets = unassignedRows.map(t => ({
                id: t.ticket_id,
                subject: t.subject,
                submittedAt: formatDateToGreek(t.created_at),
                completedAt: formatDateToGreek(t.resolved_at),
                status: mapTicketStatus(t.status).label,
                statusClass: mapTicketStatus(t.status).className
            }));
    
            const myTickets = myRows.map(t => ({
                id: t.ticket_id,
                subject: t.subject,
                submittedAt: formatDateToGreek(t.created_at),
                completedAt: formatDateToGreek(t.resolved_at),
                status: mapTicketStatus(t.status).label,
                statusClass: mapTicketStatus(t.status).className
            }));
    
            return res.render('viewtickets', {
                title: 'Πίνακας Ελέγχου - Γραμματεία',
                bodyClass: 'ticket-list',
                isStudent: false,
                isLeader: false, // Κρύβει το tab του leader
                unassignedTickets, 
                myTickets
                // Δεν στέλνουμε καν το allAssignedTickets
            });
        } catch (error) {
            console.error('Σφάλμα φόρτωσης:', error);
            return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
        }
};

export const getLeaderTickets = async (req, res) => {
    try {
            const isLeader = req.user.role === 'leader' || req.user.is_leader === 1;
            
            // Αυστηρός έλεγχος: Μόνο ο Leader μπαίνει εδώ!
            if (!req.user.secretary_id || !isLeader) {
                return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για τον Προϊστάμενο');
            }
    
            const userId = req.user.user_id || req.user.id; 
    
            // Ο Leader χρειάζεται και τα τρία Queries
            const [unassignedRows] = await dbPool.execute(queries.getUnassignedTickets);
            const [myRows] = await dbPool.execute(queries.getTicketsBySecretaryId, [userId]);
            const [allAssignedRows] = await dbPool.execute(queries.getAllAssignedTicketsForLeader);
    
            const unassignedTickets = unassignedRows.map(t => ({
                id: t.ticket_id,
                subject: t.subject,
                submittedAt: formatDateToGreek(t.created_at),
                completedAt: formatDateToGreek(t.resolved_at),
                status: mapTicketStatus(t.status).label,
                statusClass: mapTicketStatus(t.status).className
            }));
    
            const myTickets = myRows.map(t => ({
                id: t.ticket_id,
                subject: t.subject,
                submittedAt: formatDateToGreek(t.created_at),
                completedAt: formatDateToGreek(t.resolved_at),
                status: mapTicketStatus(t.status).label,
                statusClass: mapTicketStatus(t.status).className
            }));
    
            const allAssignedTickets = allAssignedRows.map(t => ({
                id: t.ticket_id,
                subject: t.subject,
                submittedAt: formatDateToGreek(t.created_at),
                completedAt: formatDateToGreek(t.resolved_at),
                status: mapTicketStatus(t.status).label,
                statusClass: mapTicketStatus(t.status).className,
                assignedSecretaryName: `${t.first_name} ${t.last_name}` 
            }));
    
            // Render στο ΙΔΙΟ hbs αρχείο, αλλά με isLeader: true
            return res.render('viewtickets', {
                title: 'Πίνακας Ελέγχου - Προϊστάμενος',
                bodyClass: 'ticket-list',
                isStudent: false,
                isLeader: true, // Εμφανίζει το tab του leader
                unassignedTickets, 
                myTickets,
                allAssignedTickets          
            });
        } catch (error) {
            console.error('Σφάλμα φόρτωσης:', error);
            return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
        }
};

export const renderUnassignedTicketModal = async (req, res) => {
    try {
        const ticket_id = Number(req.params.ticket_id);
        if (!Number.isInteger(ticket_id) || ticket_id < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός αιτήματος');
        }

        if (!req.user?.secretary_id) {
            return res.status(403).send('Η προβολή είναι διαθέσιμη μόνο για γραμματεία ή προϊστάμενο');
        }

        const modalData = await loadUnassignedTicketModalData(ticket_id);
        if (!modalData) {
            return res.status(404).send('Δεν βρέθηκε μη εκχωρημένο αίτημα');
        }

        return res.render('modalGen', {
            layout: false,
            title: `#${modalData.ticket_id} - ${modalData.ticket.subject}`,
            ...modalData,
        });
    } catch (error) {
        console.error('Error loading unassigned ticket modal:', error);
        return res.status(500).send('Σφάλμα κατά τη φόρτωση του αιτήματος');
    }
};

export const assignTicket = async (req, res) => {
    // ... (Η λογική του router.post('/tickets/assign/:id'))
    const ticketId = req.params.id;
        // ΕΔΩ: Χρησιμοποιούμε το secretary_id (π.χ. το 1 της Μαρίας) για την ενημέρωση του πίνακα TICKET
        const secId = req.user.secretary_id; 
    
        try {
            const query = `
                UPDATE TICKET 
                SET status = 'in_progress', 
                for_secretary_id = ? 
                WHERE ticket_id = ?
            `;
            
            await dbPool.execute(query, [secId, ticketId]);
            if (req.user.is_leader === 0){
                res.redirect('/secretary_viewtickets');
            } 
            else if (req.user.is_leader === 1){
                res.redirect('/leader_viewtickets');
            } 
            // else {
            //     res.redirect('/student_viewtickets');
            // }
        } catch (error) {
            console.error("Σφάλμα κατά την ανάληψη:", error);
            res.status(500).send("Αποτυχία ανάληψης αιτήματος.");
        }
};