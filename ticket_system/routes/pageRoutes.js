const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const db = require('../model/db');
const queries = require('../model/queries');

router.get('/', pageController.getHomePage);
router.get('/login', pageController.getLoginPage);

// Student card rendering middleware
async function fetchStudentByTicketIdMiddleware(req, res, next) {
    try {
        const [rows] = await db.execute(queries.getStudentInfoByTicketId, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).send("Student not found");
        }

        const studentData = rows[0];
        const currentYear = new Date().getFullYear();
        const studyYear = currentYear - studentData.enrollment_year + 1;

        // Transform database fields to template-friendly names
        const student = {
            fullName: `${studentData.first_name} ${studentData.last_name}`,
            studentAm: studentData.student_am,
            email: studentData.email,
            enrollmentYear: studentData.enrollment_year,
            studyYear: studyYear
        };
        
        // Pass student object to hbs template
        res.locals.student = student;
        
        next(); 
    } catch (error) {
        console.error("Error fetching student info:", error);
        res.status(500).send("error fetching student info");
    }
}

async function fetchStudentMiddleware(req, res, next) {
    try {
        const paramId = req.params.id;
        const authStudentId = req.isAuthenticated && req.isAuthenticated() && req.user && req.user.student_id;
        const studentId = paramId || authStudentId;

        if (!studentId) return res.redirect('/login');

        const [rows] = await db.execute(queries.getStudentInfo, [studentId]);
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
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    if (req.method === 'GET') {
        return res.redirect('/login');
    }

    return res.status(401).json({
        success: false,
        message: 'Δεν είστε συνδεδεμένος'
    });
}

function mapTicketStatus(status) {
    switch (status) {
        case 'open':
            return { label: 'Μη Εκχωρημένο', className: 'status-open' }; 
        case 'in_progress':
            return { label: 'Σε Εξέλιξη', className: 'status-in-progress' }; 
        case 'pending':
            return { label: 'Σε Αναμονή', className: 'status-pending' }; 
        case 'resolved':
            return { label: 'Resolved', className: 'status-resolved' }; 
        case 'closed':
            return { label: 'Κλειστό', className: 'status-closed' }; 
        default:
            return { label: status, className: 'status-default' };
    }
}

function formatDateToGreek(dateValue) {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('el-GR');
}

const categoryLabelMap = {
    cert_enrollment: 'Βεβαίωση Σπουδών (Γενική Χρήση)',
    cert_transcript: 'Αναλυτική Βαθμολογία',
    cert_military: 'Πιστοποιητικό για Στρατολογική Χρήση',
    cert_tax: 'Βεβαίωση για Εφορία / Επίδομα Ενοικίου',
    cert_diploma_copy: 'Αντίγραφο Πτυχίου / Διπλώματος',
    acad_registration: 'Πρόβλημα με την Εγγραφή / Ανανέωση',
    acad_courses: 'Θέματα Δηλώσεων Μαθημάτων',
    acad_regrading: 'Αίτηση Αναβαθμολόγησης',
    acad_exam_review: 'Επανεξέταση Μαθήματος',
    acad_graduation: 'Αίτηση για Ορκωμοσία / Λήψη Πτυχίου',
    status_suspension: 'Αναστολή Σπουδών',
    status_deletion: 'Αίτηση Διαγραφής από το Τμήμα',
    status_transfer: 'Θέματα Μετεγγραφών',
    status_pass: 'Πρόβλημα με την Ακαδημαϊκή Ταυτότητα (Πάσο)',
    general_query: 'Γενικό Ερώτημα / Πληροφορίες',
    other: 'Άλλο (Περιγράψτε παρακάτω)'
};

async function resolveCategoryId(categoryValue) {
    if (categoryValue === undefined || categoryValue === null) {
        return null;
    }

    const trimmedCategory = String(categoryValue).trim();
    if (!trimmedCategory) {
        return null;
    }

    if (/^\d+$/.test(trimmedCategory)) {
        const [rows] = await db.execute('SELECT category_id FROM CATEGORY WHERE category_id = ?', [Number(trimmedCategory)]);

        if (rows.length > 0) {
            return rows[0].category_id;
        }
    }

    const categoryName = categoryLabelMap[trimmedCategory] || trimmedCategory;
    const [existingRows] = await db.execute('SELECT category_id FROM CATEGORY WHERE name = ?', [categoryName]);

    if (existingRows.length > 0) {
        return existingRows[0].category_id;
    }

    const [result] = await db.execute('INSERT INTO CATEGORY (name) VALUES (?)', [categoryName]);
    return result.insertId;
}

// Student card routes
router.get('/studentViewTicket/:id', fetchStudentByTicketIdMiddleware, (req, res) => {
    res.render('studentCard'); 
});

router.get('/secretaryViewTicket/:id', fetchStudentByTicketIdMiddleware, (req, res) => {
    res.render('studentCard'); 
});

router.get('/createTicket/:id', fetchStudentMiddleware, (req, res) => {
    res.render('pages/createTicket');
});

router.get('/pages/createTicket/:id?', fetchStudentMiddleware, (req, res) => {
    res.render('pages/createTicket');
});

router.get('/user/submit', ensureAuthenticated, fetchStudentMiddleware, (req, res) => {
    res.render('pages/createTicket');
});

router.get('/user_viewtickets', ensureAuthenticated, async (req, res) => {
    try {
        // 1. Έλεγχος αν ο χρήστης είναι πράγματι φοιτητής
        if (!req.user?.student_id) {
            return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για φοιτητές');
        }

        // 2. Τραβάμε τα δεδομένα χρησιμοποιώντας το ID του φοιτητή
        const [rows] = await db.execute(queries.getTicketsByStudentId, [req.user.student_id]);

        // 3. Μορφοποίηση των δεδομένων
        const myTickets = rows.map((ticket) => {
            const mappedStatus = mapTicketStatus(ticket.status);
            return {
                id: ticket.ticket_id,
                subject: ticket.subject,
                submittedAt: formatDateToGreek(ticket.created_at),
                completedAt: formatDateToGreek(ticket.resolved_at),
                status: mappedStatus.label,
                statusClass: mappedStatus.className
                // Το actionClass συνήθως δεν χρειάζεται στον φοιτητή, αλλά αν το θες το κρατάς
            };
        });

        // 4. Render στο ΚΟΙΝΟ αρχείο της γραμματείας
        return res.render('pages/viewtickets', {
            title: 'Τα Αιτήματά μου',
            bodyClass: 'ticket-list',
            isStudent: true,    // <--- Εδώ το HBS καταλαβαίνει να κρύψει τα tabs της γραμματείας
            studentId: req.user.student_id, // <--- ΕΔΩ! Πρέπει να υπάρχει αυτή η γραμμή
            myTickets: myTickets // <--- Περνάμε τη λίστα με το όνομα που περιμένει το partial
        });

    } catch (error) {
        console.error('Error loading user tickets:', error);
        return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
    }
});

router.get('/user/tickets', ensureAuthenticated, (req, res) => {
    return res.redirect('/user_viewtickets');
});

router.post('/tickets/create', ensureAuthenticated, async (req, res) => {
    try {
        const { category, subject, description } = req.body;
        const studentId = req.user?.student_id;

        if (!studentId) {
            return res.status(403).send('Η δημιουργία αιτήματος επιτρέπεται μόνο για φοιτητές');
        }

        if (!category || !subject || !description) {
            return res.status(400).send('Συμπλήρωσε όλα τα υποχρεωτικά πεδία');
        }

        const cleanSubject = String(subject).trim();
        const cleanDescription = String(description).trim();
        
        // (Κρατάμε τη συνάρτηση resolveCategoryId που είχε ήδη ο κώδικάς σου)
        const categoryId = await resolveCategoryId(category);

        if (!cleanSubject || !cleanDescription || !categoryId) {
            return res.status(400).send('Μη έγκυρα δεδομένα αιτήματος');
        }

        await db.execute(queries.createTicket, [
            cleanSubject,
            cleanDescription,
            studentId,
            categoryId
        ]);

        // Η ΜΑΓΙΚΗ ΓΡΑΜΜΗ - Τέλος τα JSON!
        return res.redirect('/user_viewtickets');

    } catch (error) {
        console.error('Error creating ticket:', error);
        return res.status(500).send('Σφάλμα κατά τη δημιουργία αιτήματος');
    }
});

// router.get('/secretary_viewtickets', ensureAuthenticated, async (req, res) => {
//     try {
//         // 1. Έλεγχος ότι ο χρήστης είναι Γραμματεία (βάσει του ρόλου από το auth.js)
//         if (req.user?.role !== 'secretary') {
//             return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για το προσωπικό της Γραμματείας');
//         }

//         // 2. Fetch τα Μη Εκχωρημένα Αιτήματα (Πρέπει να προσθέσεις το query στο queries.js)
//         // Π.χ. SELECT * FROM TICKET WHERE secretary_id IS NULL
//         const [unassignedRows] = await db.execute(queries.getUnassignedTickets);

//         // 3. Fetch τα Αιτήματα που έχει αναλάβει ο συγκεκριμένος υπάλληλος
//         const [myRows] = await db.execute(queries.getTicketsBySecretaryId, [req.user.id]); // ή req.user.secretary_id ανάλογα πώς το αποθηκεύεις

//         // 4. Μορφοποίηση των Μη Εκχωρημένων
//         const unassignedTickets = unassignedRows.map((ticket) => {
//             const mappedStatus = mapTicketStatus(ticket.status);
//             return {
//                 id: ticket.ticket_id,
//                 subject: ticket.subject,
//                 submittedAt: formatDateToGreek(ticket.created_at),
//                 completedAt: formatDateToGreek(ticket.resolved_at),
//                 status: mappedStatus.label,
//                 statusClass: mappedStatus.className
//             };
//         });

//         // 5. Μορφοποίηση των Δικών του Αιτημάτων
//         const myTickets = myRows.map((ticket) => {
//             const mappedStatus = mapTicketStatus(ticket.status);
//             return {
//                 id: ticket.ticket_id,
//                 subject: ticket.subject,
//                 submittedAt: formatDateToGreek(ticket.created_at),
//                 completedAt: formatDateToGreek(ticket.resolved_at),
//                 status: mappedStatus.label,
//                 statusClass: mappedStatus.className
//             };
//         });

//         // 6. Αποστολή στο Handlebars (στο αρχείο views/pages/secretary-viewtickets.hbs)
//         return res.render('pages/secretary-viewtickets', {
//             title: 'Πίνακας Ελέγχου - Γραμματεία',
//             bodyClass: 'ticket-list',
//             unassignedTickets, // Στέλνουμε την πρώτη λίστα
//             myTickets          // Στέλνουμε τη δεύτερη λίστα
//         });
//     } catch (error) {
//         console.error('Error loading secretary tickets:', error);
//         return res.status(500).send('Σφάλμα κατά την ανάκτηση των αιτημάτων');
//     }
// });
// =====================================================================
// 1. ROUTE ΓΙΑ ΑΠΛΗ ΓΡΑΜΜΑΤΕΙΑ
// =====================================================================
router.get('/secretary_viewtickets', ensureAuthenticated, async (req, res) => {
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
        const [unassignedRows] = await db.execute(queries.getUnassignedTickets);
        const [myRows] = await db.execute(queries.getTicketsBySecretaryId, [userId]);

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
});


// =====================================================================
// 2. ROUTE ΓΙΑ ΠΡΟΪΣΤΑΜΕΝΟ (LEADER)
// =====================================================================
router.get('/leader_viewtickets', ensureAuthenticated, async (req, res) => {
    try {
        const isLeader = req.user.role === 'leader' || req.user.is_leader === 1;
        
        // Αυστηρός έλεγχος: Μόνο ο Leader μπαίνει εδώ!
        if (!req.user.secretary_id || !isLeader) {
            return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για τον Προϊστάμενο');
        }

        const userId = req.user.user_id || req.user.id; 

        // Ο Leader χρειάζεται και τα τρία Queries
        const [unassignedRows] = await db.execute(queries.getUnassignedTickets);
        const [myRows] = await db.execute(queries.getTicketsBySecretaryId, [userId]);
        const [allAssignedRows] = await db.execute(queries.getAllAssignedTicketsForLeader);

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
});


// 2. ΤΟ ΠΡΑΓΜΑΤΙΚΟ API ΓΙΑ ΝΑ ΑΝΑΛΑΒΕΙΣ ΕΝΑ ΑΙΤΗΜΑ
// router.post('/api/tickets/claim/:id', ensureAuthenticated, async (req, res) => {
//     try {
//         if (req.user?.role !== 'secretary') {
//             return res.status(403).json({ success: false, message: 'Μη εξουσιοδοτημένη ενέργεια' });
//         }

//         const ticketId = req.params.id;
//         const userId = req.user.id; 

//         // Ενημερώνουμε τη βάση (Update)
//         const [result] = await db.execute(queries.assignTicketToSecretary, [userId, ticketId]);

//         if (result.affectedRows === 0) {
//              return res.status(400).json({ success: false, message: 'Το αίτημα έχει ήδη ανατεθεί ή δεν υπάρχει.' });
//         }

//         res.json({ success: true, message: 'Το αίτημα ανατέθηκε επιτυχώς!' });
//     } catch (error) {
//         console.error('Σφάλμα Update:', error);
//         res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή' });
//     }
// });

// POST για την ανάληψη αιτήματος
router.post('/tickets/assign/:id', async (req, res) => {
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
        
        await db.execute(query, [secId, ticketId]);
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
});


module.exports = router;