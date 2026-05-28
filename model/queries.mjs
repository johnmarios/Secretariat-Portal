export const getUserByEmail = `
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.password,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM user u
    LEFT JOIN student s ON u.user_id = s.for_id
    LEFT JOIN secretary sec ON u.user_id = sec.for_id
    WHERE u.email = ?
`;
                
export const getUserById = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, sec.secretary_id, sec.is_leader
    FROM user u
    LEFT JOIN student s ON u.user_id = s.for_id
    LEFT JOIN secretary sec ON u.user_id = sec.for_id
    WHERE u.user_id = ?
`;

export const getStudentInfo = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, s.student_am, s.enrollment_year, s.type
    FROM user u
    JOIN student s ON u.user_id = s.for_id
    WHERE s.student_id = ?
`;

export const searchStudents = `
    SELECT
        s.student_id,
        s.student_am,
        s.enrollment_year,
        s.type,
        u.first_name,
        u.last_name,
        u.email
    FROM student s
    JOIN user u ON u.user_id = s.for_id
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


export const getCategoryIdByName = `
    SELECT category_id FROM category WHERE category_name = ? LIMIT 1
`;

export const getAllCategories = `
    SELECT category_id AS id, category_theme AS theme, category_name AS name FROM category
`;


export const insertTicket = `
    INSERT INTO ticket (created_at, for_student_id, for_category_id)
    VALUES (?, ?, ?)
`;

export const insertMessage = `
    INSERT INTO message (message_subject, message_description, created_at, for_user_id, for_ticket_id)
    VALUES (?, ?, ?, ?, ?)
`;

export const updateTicketLastUpdated = `
    UPDATE ticket SET last_updated = NOW() WHERE ticket_id = ?
`;

export const saveAttachment = `
    INSERT INTO attachment	 (file_name, file_path, file_size, file_type, for_message_id)
    VALUES (?, ?, ?, ?, ?)
`;  

export const insertInternalMessage = `
    INSERT INTO message (message_subject, message_description, created_at, for_user_id, for_ticket_id, is_internal)
    VALUES (?, ?, ?, ?, ?, 1)
`;


export const getFirstMessageByTicketId = `
    SELECT * FROM message   
    WHERE for_ticket_id = ?
    ORDER BY message_id ASC
    LIMIT 1
`;

export const getRestStudentMessagesByTicketId = `
    SELECT * FROM message
    WHERE for_ticket_id = ?
        AND for_user_id = (
            SELECT s.for_id
            FROM ticket t JOIN student s ON s.student_id = t.for_student_id
            WHERE t.ticket_id = ?
        )
        AND message_id > (
            SELECT message_id FROM message WHERE for_ticket_id = ? ORDER BY message_id ASC LIMIT 1
        )
    ORDER BY message_id ASC
`;

export const getSecretaryMessagesByTicketId = `
    SELECT * FROM message
    WHERE for_ticket_id = ?
        AND for_user_id != (
            SELECT s.for_id
            FROM ticket t JOIN student s ON s.student_id = t.for_student_id
            WHERE t.ticket_id = ?
        )
    ORDER BY message_id ASC
`;

export const getStudentInfoByTicketId = `
    SELECT u.user_id, u.first_name, u.last_name, u.email,
           s.student_id, s.student_am, s.enrollment_year, s.type
    FROM ticket t
    JOIN student s ON s.student_id = t.for_student_id
    JOIN user u ON u.user_id = s.for_id
    WHERE t.ticket_id = ?
    LIMIT 1
`;

export const getCategoryThemeByTicketId = `
    SELECT c.category_theme, c.category_name FROM ticket t
    JOIN category c ON c.category_id = t.for_category_id
    WHERE t.ticket_id = ?
    LIMIT 1
`;

export const getSecretariesForAssignment = `
    SELECT sec.secretary_id, u.first_name, u.last_name
    FROM secretary sec
    JOIN user u ON u.user_id = sec.for_id
    WHERE sec.is_leader = 0
    ORDER BY u.first_name ASC, u.last_name ASC
`;

export const getAttachmentsByMessageId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM attachment	
    WHERE for_message_id = ?
`;

export const getAttachmentsByMessagesId = `
    SELECT file_name, file_path, file_size, file_type, for_message_id FROM attachment	
    WHERE for_message_id IN (?)
`;

export const getTicketById = `
    SELECT ticket_id, status, created_at, last_updated, resolved_at, for_student_id, for_secretary_id, for_category_id
    FROM ticket
    WHERE ticket_id = ?
    LIMIT 1
`;


export const getTicketsByStudentId = `
    SELECT 
        t.ticket_id,
        (SELECT message_subject FROM message WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status,
        t.is_escalated,
        t.created_at,
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM ticket t
    JOIN category c ON t.for_category_id = c.category_id
    JOIN student s ON t.for_student_id = s.student_id
    WHERE t.for_student_id = ?
    ORDER BY t.created_at DESC
`;

export const getUnassignedTickets = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM message WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.is_escalated,
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM ticket t
    JOIN category c ON t.for_category_id = c.category_id
    JOIN student s ON t.for_student_id = s.student_id
    WHERE t.for_secretary_id IS NULL
    ORDER BY t.created_at DESC
`;

export const getTicketsBySecretaryId = `
    SELECT 
        t.ticket_id, 
        (SELECT message_subject FROM message WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.is_escalated,
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am
    FROM ticket t
    JOIN secretary sec ON t.for_secretary_id = sec.secretary_id
    JOIN category c ON t.for_category_id = c.category_id
    JOIN student s ON t.for_student_id = s.student_id
    WHERE sec.for_id = ?
    ORDER BY t.created_at DESC
`;

export const getEscalatedTickets = `
    SELECT 
        DISTINCT t.ticket_id, 
        (SELECT message_subject FROM message WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status, 
        t.is_escalated,
        t.created_at, 
        t.resolved_at,
        c.category_name AS category,
        s.student_am,
        u.first_name,
        u.last_name
    FROM ticket t
    JOIN category c ON t.for_category_id = c.category_id
    JOIN student s ON t.for_student_id = s.student_id
    LEFT JOIN secretary sec ON t.for_secretary_id = sec.secretary_id
    LEFT JOIN user u ON sec.for_id = u.user_id
    WHERE t.is_escalated = 1
    ORDER BY t.created_at DESC
`;

export const deleteAttachmentsForInternalMessages = `
    DELETE A FROM attachment	 A
    JOIN message M ON A.for_message_id = M.message_id
    WHERE M.for_ticket_id = ? AND M.is_internal = 1
`;

export const deleteInternalMessagesByTicketId = `
    DELETE FROM message WHERE for_ticket_id = ? AND is_internal = 1
`;

export const assignTicketToSecretary = `
    UPDATE ticket 
    SET for_secretary_id = (SELECT secretary_id FROM secretary WHERE for_id = ?),
        status = 'in_progress'
    WHERE ticket_id = ? AND for_secretary_id IS NULL
`;

export const getAllAssignedTicketsForLeader = `
    SELECT 
        T.ticket_id, 
        (SELECT message_subject FROM message WHERE for_ticket_id = T.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        T.status, 
        T.is_escalated,
        T.created_at, 
        T.resolved_at,
        C.category_name AS category,
        ST.student_am,
        U.first_name, 
        U.last_name 
    FROM ticket T
    JOIN category C ON T.for_category_id = C.category_id
    JOIN student ST ON T.for_student_id = ST.student_id
    JOIN secretary S ON T.for_secretary_id = S.secretary_id
    JOIN user U ON S.for_id = U.user_id
    WHERE T.for_secretary_id IS NOT NULL
    ORDER BY T.created_at DESC
`;

export const searchTicketsByStudentTerm = `
    SELECT 
        t.ticket_id,
        (SELECT message_subject FROM message WHERE for_ticket_id = t.ticket_id ORDER BY message_id ASC LIMIT 1) AS subject,
        t.status,
        t.created_at,
        s.student_am,
        u.first_name,
        u.last_name
    FROM ticket t
    JOIN student s ON s.student_id = t.for_student_id
    JOIN user u ON s.for_id = u.user_id
    WHERE s.student_am LIKE CONCAT('%', ?, '%')
       OR u.first_name LIKE CONCAT('%', ?, '%')
       OR u.last_name LIKE CONCAT('%', ?, '%')
       OR CONCAT(u.first_name, ' ', u.last_name) LIKE CONCAT('%', ?, '%')
    ORDER BY t.created_at DESC
    LIMIT 50
`;

export const getInternalMessageByTicketId = `
    SELECT m.message_description, m.created_at, u.first_name, u.last_name
    FROM message m
    JOIN user u ON m.for_user_id = u.user_id
    WHERE m.for_ticket_id = ? AND m.is_internal = 1
    ORDER BY m.created_at DESC LIMIT 1
`;

// Additional queries moved from controllers for centralization
export const getAttachmentFilePathsForInternalMessagesByTicketId = `
    SELECT A.file_path FROM attachment	 A
    JOIN message M ON A.for_message_id = M.message_id
    WHERE M.for_ticket_id = ? AND M.is_internal = 1
`;

export const updateTicketStatusWithSecretary = `
    UPDATE ticket SET status = ?, for_secretary_id = ? WHERE ticket_id = ?
`;

export const updateTicketStatusById = `
    UPDATE ticket SET status = ? WHERE ticket_id = ?
`;

export const setTicketEscalatedFlag = `
    UPDATE ticket SET is_escalated = ? WHERE ticket_id = ?
`;

export const closeStaleCompletedTickets = `
    UPDATE ticket
    SET status = 'closed', resolved_at = NOW()
    WHERE status = 'resolved' AND last_updated < DATE_SUB(NOW(), INTERVAL 1 MINUTE)
`;

export const getSecretaryIdByForId = `
    SELECT secretary_id FROM secretary WHERE for_id = ?
`;

export const getStudentIdByForId = `
    SELECT student_id FROM student WHERE for_id = ?
`;

export const insertUser = `
    INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)
`;

export const insertStudent = `
    INSERT INTO student (for_id) VALUES (?)
`;

export const insertSecretary = `
    INSERT INTO secretary (for_id, is_leader) VALUES (?, ?)
`;