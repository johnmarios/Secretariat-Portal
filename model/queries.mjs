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

// --- [ΠΡΟΣΘΗΚΗ ΣΥΝΕΡΓΑΤΗ]: Αναζήτηση Φοιτητών ---
export const searchStudents = `
    SELECT
        s.student_id,
        s.student_am,
        s.enrollment_year,
        s.type,
        u.first_name,
        u.last_name,
        u.email
    FROM STUDENT s
    JOIN USER u ON u.user_id = s.for_id
    WHERE
        s.student_am LIKE CONCAT('%', ?, '%')
        OR u.last_name LIKE CONCAT('%', ?, '%')
        OR u.first_name LIKE CONCAT('%', ?, '%')
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE CONCAT('%', ?, '%')
    ORDER BY
        CASE
            WHEN s.student_am LIKE CONCAT('%', ?, '%') THEN 0
            WHEN u.last_name LIKE CONCAT('%', ?, '%') THEN 1
            WHEN CONCAT(u.first_name, ' ', u.last_name) LIKE CONCAT('%', ?, '%') THEN 2
            ELSE 3
        END,
        u.last_name ASC,
        u.first_name ASC
    LIMIT 8
`;


// ==========================================
// 2. CATEGORIES QUERIES
// ==========================================

export const getCategoryIdByName = `
    SELECT category_id FROM CATEGORY WHERE category_name = ? LIMIT 1
`;

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

export const insertInternalMessage = `
    INSERT INTO MESSAGE (message_subject, message_description, created_at, for_user_id, for_ticket_id, is_internal)
    VALUES (?, ?, ?, ?, ?, 1)
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

export const getSecretariesForAssignment = `
    SELECT sec.secretary_id, u.first_name, u.last_name
    FROM SECRETARY sec
    JOIN USER u ON u.user_id = sec.for_id
    WHERE sec.is_leader = 0
    ORDER BY u.first_name ASC, u.last_name ASC
`;

export const getAttachmentsByMessageId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM ATTACHMENT
    WHERE for_message_id = ?
`;

export const getAttachmentsByMessagesId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM ATTACHMENT
    WHERE for_message_id IN (?)
`;

// --- [ΠΡΟΣΘΗΚΗ ΣΥΝΕΡΓΑΤΗ] ---
export const getTicketById = `
    SELECT ticket_id, status, created_at, last_updated, resolved_at, for_student_id, for_secretary_id, for_category_id
    FROM TICKET
    WHERE ticket_id = ?
    LIMIT 1
`;


// ==========================================
// 5. DASHBOARDS (Για Φοιτητή, Γραμματεία, Προϊστάμενο)
// ==========================================

// --- [ΔΙΚΕΣ ΣΟΥ ΑΛΛΑΓΕΣ]: Joins για Κατηγορία και ΑΜ σε όλα τα tables! ---

export const getTicketsByStudentId = `
    SELECT 
        t.ticket_id,
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status,
        t.created_at,
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM TICKET t
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    JOIN STUDENT s ON t.for_student_id = s.student_id
    WHERE t.for_student_id = ?
    ORDER BY t.created_at DESC
`;

export const getUnassignedTickets = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM TICKET t
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    JOIN STUDENT s ON t.for_student_id = s.student_id
    WHERE t.for_secretary_id IS NULL
    ORDER BY t.created_at DESC
`;

export const getTicketsBySecretaryId = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM TICKET t
    JOIN SECRETARY sec ON t.for_secretary_id = sec.secretary_id
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    JOIN STUDENT s ON t.for_student_id = s.student_id
    WHERE sec.for_id = ?
    ORDER BY t.created_at DESC
`;

export const getEscalatedTickets = `
    SELECT 
        DISTINCT t.ticket_id, 
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am,
        u.first_name,
        u.last_name
    FROM TICKET t
    JOIN CATEGORY c ON t.for_category_id = c.category_id
    JOIN STUDENT s ON t.for_student_id = s.student_id
    LEFT JOIN SECRETARY sec ON t.for_secretary_id = sec.secretary_id
    LEFT JOIN USER u ON sec.for_id = u.user_id
    WHERE EXISTS (
        SELECT 1 FROM MESSAGE m WHERE m.for_ticket_id = t.ticket_id AND m.is_internal = 1
    )
    ORDER BY t.created_at DESC
`;

export const deleteAttachmentsForInternalMessages = `
    DELETE A FROM ATTACHMENT A
    JOIN MESSAGE M ON A.for_message_id = M.message_id
    WHERE M.for_ticket_id = ? AND M.is_internal = 1
`;

export const deleteInternalMessagesByTicketId = `
    DELETE FROM MESSAGE WHERE for_ticket_id = ? AND is_internal = 1
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
        C.category_name AS category,
        ST.student_am,
        U.first_name, 
        U.last_name 
    FROM TICKET T
    JOIN CATEGORY C ON T.for_category_id = C.category_id
    JOIN STUDENT ST ON T.for_student_id = ST.student_id
    JOIN SECRETARY S ON T.for_secretary_id = S.secretary_id
    JOIN USER U ON S.for_id = U.user_id
    WHERE T.for_secretary_id IS NOT NULL
    ORDER BY T.created_at DESC
`;

// --- [ΠΡΟΣΘΗΚΗ ΣΥΝΕΡΓΑΤΗ]: Αναζήτηση στα Tickets ---
export const searchTicketsByStudentTerm = `
    SELECT 
        t.ticket_id,
        (SELECT message_subject FROM MESSAGE WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status,
        t.created_at,
        s.student_am,
        u.first_name,
        u.last_name
    FROM TICKET t
    JOIN STUDENT s ON s.student_id = t.for_student_id
    JOIN USER u ON s.for_id = u.user_id
    WHERE s.student_am LIKE CONCAT('%', ?, '%')
       OR u.first_name LIKE CONCAT('%', ?, '%')
       OR u.last_name LIKE CONCAT('%', ?, '%')
       OR CONCAT(u.first_name, ' ', u.last_name) LIKE CONCAT('%', ?, '%')
    ORDER BY t.created_at DESC
    LIMIT 50
`;

export const getInternalMessageByTicketId = `
    SELECT m.message_description, m.created_at, u.first_name, u.last_name
    FROM MESSAGE m
    JOIN USER u ON m.for_user_id = u.user_id
    WHERE m.for_ticket_id = ? AND m.is_internal = 1
    ORDER BY m.created_at DESC LIMIT 1
`;