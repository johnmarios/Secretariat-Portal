// export const getUserByEmailAndPassword = `
//                     SELECT u.user_id, u.first_name, u.last_name, u.email,
//                            s.student_id, sec.secretary_id, sec.is_leader
//                     FROM USER u
//                     LEFT JOIN STUDENT s ON u.user_id = s.for_id
//                     LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
//                     WHERE u.email = ? AND u.password = ?
//                 `;
                
// export const getUserById = `
//                 SELECT u.user_id, u.first_name, u.last_name, u.email,
//                 s.student_id, sec.secretary_id, sec.is_leader
//                 FROM USER u
//                 LEFT JOIN STUDENT s ON u.user_id = s.for_id
//                 LEFT JOIN SECRETARY sec ON u.user_id = sec.for_id
//                 WHERE u.user_id = ?
//                 `;

export const getStudentInfo = `
                SELECT u.user_id, u.first_name, u.last_name, u.email,
                s.student_id, s.student_am, s.enrollment_year, s.type
                FROM USER u
                JOIN STUDENT s ON u.user_id = s.for_id
                WHERE s.student_id = ?
                `;

export const getCategoryIdByName = `
                SELECT category_id FROM CATEGORY WHERE name = ? LIMIT 1
                `;



export const getAllCategories = `
                SELECT * FROM CATEGORY
                `;
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

export const getFirstMessageByTicketId = `
                SELECT * FROM MESSAGE   
                WHERE for_ticket_id = ?
                ORDER BY message_id ASC
                LIMIT 1
                `;

// get all messages of a ticket that are from the student, ordered by message_id ascending and 
//keep everything except the initial message                
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
                SELECT c.theme FROM TICKET t
                JOIN CATEGORY c ON c.category_id = t.for_category_id
                WHERE t.ticket_id = ?
                LIMIT 1
                `;
export const getAttachmentsByMessageId = `
                SELECT file_name, file_path, file_size, file_type FROM ATTACHMENT
                WHERE for_message_id = ?
                `;

export const getAttachmentsByMessagesId = `
                SELECT file_name, file_path, file_size, file_type FROM ATTACHMENT
                WHERE for_message_id IN (?)
                `;

// export const getMessagesByTicketId = `
//                 SELECT
//                     m.message_id,
//                     m.message_subject,
//                     m.message_description,
//                     m.for_user_id,
//                     m.for_ticket_id,
//                     CASE
//                         WHEN m.for_user_id = t.for_student_id THEN 'student'
//                         ELSE 'secretary'
//                     END AS sender_role
//                 FROM MESSAGE m
//                 JOIN TICKET t ON t.ticket_id = m.for_ticket_id
//                 WHERE m.for_ticket_id = ?
//                 ORDER BY m.message_id ASC
//                 `;

