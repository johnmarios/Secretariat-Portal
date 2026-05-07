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

    return res.status(401).json({
        success: false,
        message: 'Δεν είστε συνδεδεμένος'
    });
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
        const categoryId = Number(category);

        if (!cleanSubject || !cleanDescription || Number.isNaN(categoryId)) {
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