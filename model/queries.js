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
                INSERT INTO MESSAGE (message_subject, message_description, for_user_id, for_ticket_id)
                VALUES (?, ?, ?, ?)
                `;

export const saveAttachment = `
                INSERT INTO ATTACHMENT (file_name, file_path, file_size, for_message_id)
                VALUES (?, ?, ?, ?)
                `;  

