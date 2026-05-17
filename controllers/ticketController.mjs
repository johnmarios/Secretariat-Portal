import fs from 'node:fs';
import path from 'node:path';

// ΝΕΟ IMPORT: Παίρνουμε το pool (για σένα) ΚΑΙ τα functions (για τον συνεργάτη)
import dbPool, * as db from '../model/db.js';
import * as queries from '../model/queries.mjs';


// 1. --- Βοηθητικές συναρτήσεις συνεργάτη ---
let buildStudent = (row) => {
    if (!row) return null;
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim(); 
    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear(); 
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);
    return { fullName, studentAm: row.student_am, email: row.email, studyYear: String(studyYear) };
}

let createOptions = async () => {
    const flatCategories = await db.getAllCategories();
    return flatCategories.reduce((acc, item) => {
        let group = acc.find(g => g.themeName === item.theme);
        if (!group) { group = { themeName: item.theme, options: [] }; acc.push(group); }
        group.options.push({ id: String(item.id), name: item.name });
        return acc;
    }, []);
};

// 2. --- Controllers Συνεργάτη ---
export const renderCreateTicketPage = async (req, res) => {
    try {
        const student_id = Number(req.params.student_id);
        if (!Number.isInteger(student_id) || student_id < 1) return res.status(400).send('Μη έγκυρος αριθμός');
        
        const row = await db.getStudentInfo(student_id);
        if (!row) return res.status(404).send('Δεν βρέθηκε ο φοιτητής');
        
        res.render('pages/createTicket', { // <-- Πρόσθεσα το 'pages/' που είχες εσύ στο view σου
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

export const submitCreateTicket = async (req, res) => {
    try {
        const { subject, description, category_id } = req.body;
        const files = req.files; 
        const student_id = Number(req.params.student_id);

        if (!Number.isInteger(student_id) || student_id < 1) return res.status(400).send('Μη έγκυρος αριθμός');
        if (!category_id) return res.status(400).send('Επιλέξτε κατηγορία');
        if (!subject?.trim() || !description?.trim()) return res.status(400).send('Συμπληρώστε υποχρεωτικά πεδία');

        const ticket_id = await db.insertTicket({ created_at: new Date(), for_student_id: student_id, for_category_id: category_id });
        const message_id = await db.insertMessage({ message_subject: subject.trim(), message_description: description.trim(), created_at: new Date(), for_user_id: student_id, for_ticket_id: ticket_id });
        
        if (files && files.length > 0) {
            for (let file of files) {
                await db.saveAttachment({ file_path: file.path, file_name: file.originalname, file_size: file.size, file_type: file.mimetype, file_id: file.filename, for_message_id: message_id });
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

        return res.render('pages/viewtickets', {
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
    
            return res.render('pages/viewtickets', {
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
            return res.render('pages/viewtickets', {
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