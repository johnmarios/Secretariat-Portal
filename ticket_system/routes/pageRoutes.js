const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const db = require('../model/sql/db');
const queries = require('../model/sql/queries');

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
    const statusMap = {
        open: { label: 'Ανοιχτό', className: 'open', actionClass: 'btn-open' },
        in_progress: { label: 'Σε εξέλιξη', className: 'in-progress', actionClass: 'btn-progress' },
        pending: { label: 'Εκκρεμές', className: 'pending', actionClass: 'btn-pending' },
        resolved: { label: 'Επιλυμένο', className: 'closed', actionClass: 'btn-closed' },
        closed: { label: 'Κλειστό', className: 'closed', actionClass: 'btn-closed' }
    };

    return statusMap[status] || { label: status || '-', className: 'pending', actionClass: 'btn-pending' };
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
        if (!req.user?.student_id) {
            return res.status(403).send('Η σελίδα είναι διαθέσιμη μόνο για φοιτητές');
        }

        const [rows] = await db.execute(queries.getTicketsByStudentId, [req.user.student_id]);

        const tickets = rows.map((ticket) => {
            const mappedStatus = mapTicketStatus(ticket.status);
            return {
                id: ticket.ticket_id,
                subject: ticket.subject,
                submittedAt: formatDateToGreek(ticket.created_at),
                completedAt: formatDateToGreek(ticket.resolved_at),
                status: mappedStatus.label,
                statusClass: mappedStatus.className,
                actionClass: mappedStatus.actionClass
            };
        });

        return res.render('pages/user-viewtickets', {
            title: 'Τα Αιτήματά μου',
            bodyClass: 'ticket-list',
            tickets
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
            return res.status(403).json({
                success: false,
                message: 'Η δημιουργία αιτήματος επιτρέπεται μόνο για φοιτητές'
            });
        }

        if (!category || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Συμπλήρωσε όλα τα υποχρεωτικά πεδία'
            });
        }

        const cleanSubject = String(subject).trim();
        const cleanDescription = String(description).trim();
        const categoryId = await resolveCategoryId(category);

        if (!cleanSubject || !cleanDescription || !categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Μη έγκυρα δεδομένα αιτήματος'
            });
        }

        const [result] = await db.execute(queries.createTicket, [
            cleanSubject,
            cleanDescription,
            studentId,
            categoryId
        ]);

        return res.status(201).json({
            success: true,
            message: 'Το αίτημα δημιουργήθηκε επιτυχώς',
            ticketId: result.insertId
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Σφάλμα κατά τη δημιουργία αιτήματος'
        });
    }
});

module.exports = router;