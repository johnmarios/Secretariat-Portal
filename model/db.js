import mysql from 'mysql2/promise';
import * as sql from '../model/queries.js';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});


export async function getStudentInfo(student_id) {
    try {
        const [rows] = await pool.query(sql.getStudentInfo, [student_id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching student info:', error);
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

export async function insertMessage({message_subject, message_description, for_user_id, for_ticket_id}) {
    const [result] = await pool.query(sql.insertMessage, [
        message_subject,
        message_description,
        for_user_id,
        for_ticket_id,
    ]);
    return result.insertId;
}

export async function getAllCategories() {
    const [rows] = await pool.query(sql.getAllCategories);
    return rows;
}

export async function saveAttachment({ for_message_id, file_path, file_name, file_size }) {
    const [result] = await pool.query(sql.saveAttachment, [
        file_path,
        file_name,
        file_size,
        for_message_id
    ]);
    return result.insertId;
}
export default pool;