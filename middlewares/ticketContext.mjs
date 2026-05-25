import dbPool from '../model/db.js';
import * as queries from '../model/queries.mjs';

// Loads the authenticated user's student record (by their student_id) and
// exposes it on res.locals.student. Used by routes that expect the
// "studentCard" partial to be available.
export const fetchStudentByTicketIdMiddleware = async (req, res, next) => {
    try {
        const [rows] = await dbPool.execute(queries.getTicketsByStudentId, [req.user.student_id]);
        if (rows.length === 0) return res.status(404).send('Student not found');

        const studentData = rows[0];
        const studyYear = new Date().getFullYear() - studentData.enrollment_year + 1;

        res.locals.student = {
            fullName: `${studentData.first_name} ${studentData.last_name}`,
            studentAm: studentData.student_am,
            email: studentData.email,
            enrollmentYear: studentData.enrollment_year,
            studyYear,
        };
        next();
    } catch (error) {
        console.error('Error fetching student info:', error);
        res.status(500).send('error fetching student info');
    }
};

// Loads the student identified by :id param or by the authenticated user's
// student_id (for use on createTicket-style pages).
export const fetchStudentMiddleware = async (req, res, next) => {
    try {
        const paramId = req.params.id;
        const authStudentId =
            req.isAuthenticated && req.isAuthenticated() && req.user && req.user.student_id;
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
            studyYear,
        };

        next();
    } catch (err) {
        console.error('Error loading createTicket page:', err);
        res.status(500).send('Server error');
    }
};
