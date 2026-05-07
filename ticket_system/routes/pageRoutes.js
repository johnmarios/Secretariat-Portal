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

module.exports = router;