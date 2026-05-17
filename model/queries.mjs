// ==========================================
// 1. AUTH & USER QUERIES
// ==========================================

export const getUserByEmailAndPassword = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM USER u
    LEFT JOIN STUDENT s ON u.user_id = s.for_id
    LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
    WHERE u.email = ? AND u.password = ?
`;
                
export const getUserById = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM USER u
    LEFT JOIN STUDENT s ON u.user_id = s.for_id
    LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
    WHERE u.user_id = ?
`;

export const getStudentInfo = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, s.student_am, s.enrollment_year, s.type
    FROM USER u
    JOIN STUDENT s ON u.user_id = s.for_id
    WHERE s.student_id = ?
`;


// ==========================================
// 2. CATEGORIES QUERIES
// ==========================================

export const getCategoryIdByName = `
    SELECT category_id FROM CATEGORY WHERE category_name = ? LIMIT 1
`;

// Φέρνουμε τα νέα ονόματα στηλών, αλλά τα κάνουμε "AS" για να μη χαλάσει το Frontend σου!
export const getAllCategories = `
    SELECT category_id AS id, category_theme AS theme, category_name AS name FROM CATEGORY
`;


// ==========================================
// 3. TICKET CREATION & MESSAGES 
// ==========================================

export const insertTicket = `
    INSERT INTO TICKET (created_at, for_student_id, for_category_id)
    VALUES (?, ?, ?)
`;

export const insertMessage = `
    INSERT INTO MESSAGE (message_subject, message_description, created_at, for_user_id, for_ticket_id)
    VALUES (?, ?, ?, ?, ?)
`;

export const updateTicketLastUpdated = `
    UPDATE TICKET SET last_updated = NOW() WHERE ticket_id = ?
`;

export const saveAttachment = `
    INSERT INTO ATTACHMENT (file_name, file_path, file_size, file_type, for_message_id)
    VALUES (?, ?, ?, ?, ?)
`;  


// ==========================================
// 4. VIEW TICKETS DATA (Λεπτομέρειες Αιτήματος)
// ==========================================

export const getFirstMessageByTicketId = `
    SELECT * FROM MESSAGE   
    WHERE for_ticket_id = ?
    ORDER BY message_id ASC
    LIMIT 1
`;

export const getRestStudentMessagesByTicketId = `
    SELECT * FROM MESSAGE
    WHERE for_ticket_id = ?
        AND for_user_id = (SELECT for_student_id FROM TICKET WHERE ticket_id = ?)
        AND message_id > (
            SELECT message_id FROM MESSAGE WHERE for_ticket_id = ? ORDER BY message_id ASC LIMIT 1
        )
    ORDER BY message_id ASC
`;

export const getSecretaryMessagesByTicketId = `
    SELECT * FROM MESSAGE
    WHERE for_ticket_id = ? AND for_user_id != (SELECT for_student_id FROM TICKET WHERE ticket_id = ?)
    ORDER BY message_id ASC
`;

export const getStudentInfoByTicketId = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, s.student_am, s.enrollment_year, s.type
    FROM TICKET t
    JOIN STUDENT s ON s.student_id = t.for_student_id
    JOIN USER u ON u.user_id = s.for_id
    WHERE t.ticket_id = ?
    LIMIT 1
`;

export const getCategoryThemeByTicketId = `
    SELECT c.category_theme, c.category_name FROM TICKET t
    JOIN CATEGORY c ON c.category_id = t.for_category_id
    WHERE t.ticket_id = ?
    LIMIT 1
`;

export const getAttachmentsByMessageId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM ATTACHMENT
    WHERE for_message_id = ?
`;

export const getAttachmentsByMessagesId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM ATTACHMENT
    WHERE for_message_id IN (?)
`;


// ==========================================
// 5. DASHBOARDS (Για Φοιτητή, Γραμματεία, Προϊστάμενο)
// ==========================================

// Επειδή το subject δεν υπάρχει πια στο TICKET, το τραβάμε από το 1ο MESSAGE!
export const getTicketsByStudentId = `
    SELECT 
        t.ticket_id,
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status,
        t.created_at,
        t.resolved_at,
        c.category_name
    FROM TICKET t
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    WHERE t.for_student_id = ?
    ORDER BY t.created_at DESC
`;

export const getUnassignedTickets = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.created_at, 
        t.resolved_at
    FROM TICKET t
    WHERE t.for_secretary_id IS NULL
    ORDER BY t.created_at DESC
`;

export const getTicketsBySecretaryId = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.created_at, 
        t.resolved_at
    FROM TICKET t
    JOIN SECRETARY sec ON t.for_secretary_id = sec.secretary_id
    WHERE sec.for_id = ?
    ORDER BY t.created_at DESC
`;

export const assignTicketToSecretary = `
    UPDATE TICKET 
    SET for_secretary_id = (SELECT secretary_id FROM SECRETARY WHERE for_id = ?),
        status = 'in_progress'
    WHERE ticket_id = ? AND for_secretary_id IS NULL
`;

export const getAllAssignedTicketsForLeader = `
    SELECT 
        T.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = T.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        T.status, 
        T.created_at, 
        T.resolved_at,
        U.first_name, 
        U.last_name 
    FROM TICKET T
    JOIN SECRETARY S ON T.for_secretary_id = S.secretary_id
    JOIN USER U ON S.for_id = U.user_id
    WHERE T.for_secretary_id IS NOT NULL
    ORDER BY T.created_at DESC
`;