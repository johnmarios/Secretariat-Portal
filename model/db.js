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

// async function initializeDatabase() {
//     try {
//         const connection = await pool.getConnection();
//         console.log('Connected to the database successfully.');
//         connection.release();
//     } catch (error) {
//         console.error('Error connecting to the database:', error);
//     }
// }

// initializeDatabase();

export async function getStudentInfo(studentId) {
    try {
        const [rows] = await pool.query(sql.getStudentInfo, [studentId]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching student info:', error);
        throw error;
    }
}

export async function getCategoryIdByName(categoryKey) {
    const [rows] = await pool.query(sql.getCategoryIdByName, [categoryKey]);
    return rows[0]?.category_id ?? null;
}

export async function insertTicket(subject, description, studentId, categoryId) {
    const [result] = await pool.query(sql.createTicket, [
        subject,
        description,
        studentId,
        categoryId,
    ]);
    return result.insertId;
}

export async function getAllCategories() {
    const [rows] = await pool.query(sql.getAllCategories);
    return rows;
}

export default pool;