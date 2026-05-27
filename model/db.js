import mysql from 'mysql2/promise';
import * as sql from '../model/queries.mjs';
import { formatUserDisplayName } from '../utils/displayName.mjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD, 
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,       
    
//     ssl: {
//         rejectUnauthorized: false
//     },
    
//     waitForConnections: true,
//     connectionLimit: 10
// });

export async function getStudentInfo(student_id) {
    try {
        const [rows] = await pool.query(sql.getStudentInfo, [student_id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching student info:', error);
        throw error;
    }
}

export async function getSecretaryIdByForId(for_id) {
    const [rows] = await pool.query(sql.getSecretaryIdByForId, [for_id]);
    return rows[0];
}

export async function getStudentIdByForId(for_id) {
    const [rows] = await pool.query(sql.getStudentIdByForId, [for_id]);
    return rows[0];
}

export async function insertUser({ first_name, last_name, email, password }) {
    const [result] = await pool.query(sql.insertUser, [first_name, last_name, email, password]);
    return result.insertId;
}

export async function insertStudentForUser(for_id) {
    const [result] = await pool.query(sql.insertStudent, [for_id]);
    return result.insertId;
}

export async function insertSecretaryForUser(for_id, is_leader = 0) {
    const [result] = await pool.query(sql.insertSecretary, [for_id, is_leader]);
    return result.insertId;
}

export async function searchStudents(searchTerm) {
    try {
        const normalizedTerm = String(searchTerm || '').trim();
        if (!normalizedTerm) return [];

        const params = [
            normalizedTerm,
            normalizedTerm,
            normalizedTerm,
            normalizedTerm,
            normalizedTerm,
            normalizedTerm,
            normalizedTerm,
        ];
        const [rows] = await pool.query(sql.searchStudents, params);
        return rows;
    } catch (error) {
        console.error('Error searching students:', error);
        throw error;
    }
}

export async function getCategoryIdByName(category_name) {
    const [rows] = await pool.query(sql.getCategoryIdByName, [category_name]);
    return rows[0]?.category_id ?? null;
}

export async function insertTicket({created_at, for_student_id, for_category_id}) {
    const [result] = await pool.query(sql.insertTicket, [
        created_at,
        for_student_id,
        for_category_id,
    ]);
    return result.insertId;
}

export async function insertMessage({message_subject, message_description, created_at, for_user_id, for_ticket_id}) {
    const [result] = await pool.query(sql.insertMessage, [
        message_subject,
        message_description,
        created_at,
        for_user_id,
        for_ticket_id,
    ]);
    //update ticket's last_updated timestamp
    await pool.query(sql.updateTicketLastUpdated, [for_ticket_id]);
    return result.insertId;
}

export async function insertInternalMessage({message_subject, message_description, created_at, for_user_id, for_ticket_id}) {
    const [result] = await pool.query(sql.insertInternalMessage, [
        message_subject,
        message_description,
        created_at,
        for_user_id,
        for_ticket_id
    ]);
    await pool.query(sql.updateTicketLastUpdated, [for_ticket_id]);
    return result.insertId;
}

export async function getAllCategories() {
    const [rows] = await pool.query(sql.getAllCategories);
    return rows;
}

export async function saveAttachment({ for_message_id, file_path, file_name, file_size, file_type }) {

    // Διόρθωση ονόματος αρχείου για Ελληνικά (αν χρειάζεται)
    let correctName = file_name;
    try {
        correctName = Buffer.from(file_name, 'latin1').toString('utf8');
    } catch (error) {
        console.error('Σφάλμα κατά τη μετατροπή των Ελληνικών:', error);
    }

    const [result] = await pool.query(sql.saveAttachment, [
        correctName,
        file_path,      
        file_size,
        file_type,
        for_message_id
    ]);
    return result.insertId;
}

export async function getFirstMessageByTicketId(ticket_id) {
    const [rows] = await pool.query(sql.getFirstMessageByTicketId, [ticket_id]);
    return rows[0];
}
export async function getRestStudentMessagesByTicketId(ticket_id) {
    const [rows] = await pool.query(sql.getRestStudentMessagesByTicketId, [ticket_id, ticket_id, ticket_id]);
    return rows;
}
export async function getSecretaryMessagesByTicketId(ticket_id) {
    const [rows] = await pool.query(sql.getSecretaryMessagesByTicketId, [ticket_id, ticket_id]);
    return rows;
}

export async function getStudentInfoByTicketId(ticket_id) {
    const [rows] = await pool.query(sql.getStudentInfoByTicketId, [ticket_id]);
    return rows[0];
}

export async function getCategoryThemeByTicketId(ticket_id) {
    const [rows] = await pool.query(sql.getCategoryThemeByTicketId, [ticket_id]);
    return rows[0];
}
export async function getSecretariesForAssignment() {
    const [rows] = await pool.query(sql.getSecretariesForAssignment);
    
    return rows.map((row) => ({
        secretary_id: row.secretary_id,
        displayName: formatUserDisplayName(row, ''),
    }));
}
export async function getAttachmentsByMessageId(message_id) {
    const [rows] = await pool.query(sql.getAttachmentsByMessageId, [message_id]);
    return rows;
}
export async function getAttachmentsByMessagesId(message_ids) {
    const [rows] = await pool.query(sql.getAttachmentsByMessagesId, [message_ids]);
    return rows;
}

export async function getTicketById(ticket_id) {
    const [rows] = await pool.query(sql.getTicketById, [ticket_id]);
    return rows[0];
}

export async function closeStaleCompletedTickets() {
    const [result] = await pool.query(sql.closeStaleCompletedTickets);
    return result;
}

export async function searchTicketsByStudentTerm(term) {
    const t = String(term || '').trim();
    if (!t) return [];
    const params = [t, t, t, t];
    const [rows] = await pool.query(sql.searchTicketsByStudentTerm, params);
    return rows;
}


export default pool;