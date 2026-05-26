import bcrypt from 'bcryptjs';
import dbPool from '../model/db.js';
import * as sql from '../model/queries.mjs';

const email = process.argv[2] || 'secretary1@uni.gr';
const password = process.argv[3] || '123456';

try {
    const [rows] = await dbPool.execute(sql.getUserByEmail, [email]);
    if (rows.length === 0) {
        console.log('No user with email:', email);
    } else {
        const user = rows[0];
        const matches = await bcrypt.compare(password, user.password);
        console.log('Password matches:', matches);
        if (matches) {
            const { password: _hash, ...safe } = user;
            console.log(safe);
        }
    }

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
