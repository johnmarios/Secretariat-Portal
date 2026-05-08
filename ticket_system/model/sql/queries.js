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

const getTicketsByStudentId = `
                SELECT 
                    ticket_id,
                    subject,
                    status,
                    created_at,
                    resolved_at
                FROM TICKET
                WHERE for_student_id = ?
                ORDER BY created_at DESC
                `;

module.exports = {
       getUserByEmailAndPassword,
       getUserById,
       getStudentInfo,
       createTicket,
       getTicketsByStudentId,
};