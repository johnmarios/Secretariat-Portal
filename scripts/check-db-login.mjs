import dbPool from '../model/db.js';
import * as sql from '../model/queries.mjs';

const email = process.argv[2] || 'secretary1@uni.gr';
const password = process.argv[3] || '123456';

try {
    const [rows] = await dbPool.execute(sql.getUserByEmailAndPassword, [email, password]);
    console.log('Users found:', rows.length);
    if (rows[0]) console.log(rows[0]);

    const [counts] = await dbPool.query(`
        SELECT
            (SELECT COUNT(*) FROM USER) AS users,
            (SELECT COUNT(*) FROM STUDENT) AS students,
            (SELECT COUNT(*) FROM SECRETARY) AS secretaries,
            (SELECT COUNT(*) FROM TICKET) AS tickets
    `);
    console.log('Counts:', counts[0]);
} catch (err) {
    console.error('DB error:', err.message);
    process.exitCode = 1;
} finally {
    await dbPool.end();
}
