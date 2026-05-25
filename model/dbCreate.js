import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function main() {
    console.log(`Δημιουργία πινάκων από: ${SCHEMA_PATH}`);

    const schema = await fs.readFile(SCHEMA_PATH, 'utf8');

    // multipleStatements allows running the whole schema file in one query
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    try {
        await connection.query(schema);
        console.log(`Επιτυχία: το schema εφαρμόστηκε στη βάση "${process.env.DB_NAME}".`);
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error('Σφάλμα κατά τη δημιουργία schema:', error);
    process.exitCode = 1;
});
