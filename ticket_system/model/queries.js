const getUserByEmailAndPassword = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM USER u
    LEFT JOIN STUDENT s ON u.user_id = s.for_id
    LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
    WHERE u.email = ? AND u.password = ?
`;
                
const getUserById = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM USER u
    LEFT JOIN STUDENT s ON u.user_id = s.for_id
    LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
    WHERE u.user_id = ?
`;

const getStudentInfo = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, s.student_am, s.enrollment_year, s.type
    FROM USER u
    JOIN STUDENT s ON u.user_id = s.for_id
    WHERE s.student_id = ?
`;

const createTicket = `
    INSERT INTO TICKET (subject, description, for_student_id, for_category_id)
    VALUES (?, ?, ?, ?)
`;

// Τα αιτήματα του φοιτητή (φέρνουμε και το όνομα της κατηγορίας αν χρειαστεί)
const getTicketsByStudentId = `
    SELECT 
        t.ticket_id,
        t.subject,
        t.status,
        t.created_at,
        t.resolved_at,
        c.name as category_name
    FROM TICKET t
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    WHERE t.for_student_id = ?
    ORDER BY t.created_at DESC
`;

// ----------------- ΝΕΑ QUERIES ΓΙΑ ΤΗ ΓΡΑΜΜΑΤΕΙΑ ----------------- //

// Φέρνει τα μη εκχωρημένα
const getUnassignedTickets = `
    SELECT ticket_id, subject, status, created_at, resolved_at
    FROM TICKET
    WHERE for_secretary_id IS NULL
    ORDER BY created_at DESC
`;

// Φέρνει τα αιτήματα του συγκεκριμένου υπαλλήλου (βάσει του user_id του)
const getTicketsBySecretaryId = `
    SELECT t.ticket_id, t.subject, t.status, t.created_at, t.resolved_at
    FROM TICKET t
    JOIN SECRETARY sec ON t.for_secretary_id = sec.secretary_id
    WHERE sec.for_id = ?
    ORDER BY t.created_at DESC
`;

// Αναθέτει το αίτημα στον υπάλληλο και του αλλάζει status
const assignTicketToSecretary = `
    UPDATE TICKET 
    SET for_secretary_id = (SELECT secretary_id FROM SECRETARY WHERE for_id = ?),
        status = 'in_progress'
    WHERE ticket_id = ? AND for_secretary_id IS NULL
`;


// Φέρνει ΟΛΑ τα εκχωρημένα αιτήματα μαζί με το όνομα του υπαλλήλου (Για τον Προϊστάμενο)
const getAllAssignedTicketsForLeader = `
    SELECT T.*, U.first_name, U.last_name 
    FROM TICKET T
    JOIN SECRETARY S ON T.for_secretary_id = S.secretary_id
    JOIN USER U ON S.for_id = U.user_id
    WHERE T.for_secretary_id IS NOT NULL
    ORDER BY T.created_at DESC
`;

const getAllCategories = `SELECT category_id AS id, name FROM CATEGORY`;

module.exports = {
    getUserByEmailAndPassword,
    getUserById,
    getStudentInfo,
    createTicket,
    getTicketsByStudentId,
    getUnassignedTickets,
    getTicketsBySecretaryId,
    assignTicketToSecretary,
    getAllAssignedTicketsForLeader,
    getAllCategories
};