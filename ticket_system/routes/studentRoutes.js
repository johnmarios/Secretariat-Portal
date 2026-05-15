const express = require('express');
const router = express.Router();
const db = require('../model/db');
const queries = require('../model/queries');

// GET /api/student/:student_id - Φέρνει τα στοιχεία φοιτητή
router.get('/student/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        
        if (!student_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID είναι υποχρεωτικό' 
            });
        }

        const [rows] = await db.execute(queries.getStudentInfo, [student_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Φοιτητής δεν βρέθηκε' 
            });
        }

        const student = rows[0];
        
        // Υπολογίζουμε το έτος σπουδών
        const currentYear = new Date().getFullYear();
        const enrollmentYear = student.enrollment_year;
        const studyYear = currentYear - enrollmentYear + 1;

        res.json({
            success: true,
            data: {
                studentId: student.student_id,
                firstName: student.first_name,
                lastName: student.last_name,
                fullName: `${student.first_name} ${student.last_name}`,
                email: student.email,
                studentAm: student.student_am,
                enrollmentYear: student.enrollment_year,
                type: student.type,
                studyYear: studyYear,
                typeLabel: getStudentTypeLabel(student.type)
            }
        });

    } catch (error) {
        console.error('Σφάλμα κατά την ανάκτηση στοιχείων φοιτητή:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Σφάλμα κατά την ανάκτηση των δεδομένων' 
        });
    }
});

// Βοηθητική συνάρτηση για τύπο φοιτητή
function getStudentTypeLabel(type) {
    const types = {
        'undergrad': 'Προπτυχιακός',
        'postgrad': 'Μεταπτυχιακός',
        'phd': 'Διδακτορικός'
    };
    return types[type] || type;
}

module.exports = router;