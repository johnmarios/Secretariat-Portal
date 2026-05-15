// Χρησιμοποιούμε require αντί για import
const db = require('../model/db');
const queries = require('../model/queries');

const renderCreateTicketPage = async (req, res) => {
    try {
        const studentId = Number(req.params.student_id);
        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }

        // Φέρνουμε τον φοιτητή με τον δικό σου τρόπο (db.execute)
        const [rows] = await db.execute(queries.getStudentInfo, [studentId]);
        const row = rows[0];

        if (!row) {
            return res.status(404).send('Δεν βρέθηκε ο φοιτητής');
        }

        // Κάνουμε render τη σελίδα (αν το αρχείο σου είναι στο views/pages/, γράψε 'pages/createTicket')
        res.render('pages/createTicket', {
            title: 'Νέο Αίτημα',
            student: buildStudent(row), 
            studentId,
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

    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear(); 
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);

    const am = row.student_am;
    const email = row.email;
    
    return {
        fullName,
        studentAm: am,
        email,
        studyYear: String(studyYear)
    };
};

let createOptions = async () => {
    // Φέρνουμε όλες τις κατηγορίες από τη βάση σου
    const [flatCategories] = await db.execute(queries.getAllCategories);

    // Αφού δεν υπάρχει στήλη 'theme', τις βάζουμε όλες σε μία κεντρική ομάδα 
    // για να δουλέψει σωστά το <optgroup> στο HBS του συναδέλφου
    const groupedCategories = [
        { 
            themeName: 'Διαθέσιμες Κατηγορίες', 
            options: flatCategories 
        }
    ];

    return groupedCategories;
};

const submitCreateTicket = async (req, res) => {
    try {
        const { student_id, category, subject, description } = req.body;

        if (!subject || !description || !category) {
            return res.status(400).send('Παρακαλώ συμπληρώστε όλα τα πεδία.');
        }

        // Εκτέλεση του query στη βάση
        await db.execute(queries.createTicket, [
            subject.trim(),
            description.trim(),
            student_id,
            category
        ]);

        // ΑΝΤΙ ΓΙΑ res.json, ΚΑΝΟΥΜΕ REDIRECT:
        // Αυτό θα στείλει τον φοιτητή στη σελίδα με τη λίστα των αιτημάτων του
        return res.redirect('/user_viewtickets');

    } catch (error) {
        console.error('Σφάλμα κατά την υποβολή:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// Εξάγουμε τη συνάρτηση (CommonJS style)
module.exports = {
    renderCreateTicketPage,
    submitCreateTicket
};