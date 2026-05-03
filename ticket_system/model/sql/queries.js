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

module.exports = {
       getUserByEmailAndPassword,
       getUserById,
};