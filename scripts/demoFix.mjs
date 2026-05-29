#!/usr/bin/env node
// scripts/demoFix.mjs
// Standalone script to fix secretary emails that have an extra dot

import dbPool from '../model/db.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
    const updates = [
        { oldEmail: 'secretary2@.uni.gr', newEmail: 'secretary2@uni.gr' },
        { oldEmail: 'secretary3@.uni.gr', newEmail: 'secretary3@uni.gr' },
    ];

    try {
        for (const u of updates) {
            const [res] = await dbPool.query('UPDATE user SET email = ? WHERE email = ?', [u.newEmail, u.oldEmail]);
            console.log(`Updated ${res.affectedRows} rows: ${u.oldEmail} -> ${u.newEmail}`);
        }

        const credPath = path.join(process.cwd(), 'seed-credentials.txt');
        try {
            let txt = await fs.readFile(credPath, 'utf8');
            txt = txt.replace(/secretary2@\.uni\.gr/g, 'secretary2@uni.gr');
            txt = txt.replace(/secretary3@\.uni\.gr/g, 'secretary3@uni.gr');
            await fs.writeFile(credPath, txt, 'utf8');
            console.log('seed-credentials.txt updated');
        } catch (e) {
            console.warn('Could not update seed-credentials.txt:', e.message);
        }
    } catch (err) {
        console.error('Error running updates:', err);
        process.exitCode = 2;
    } finally {
        try { await dbPool.end(); } catch (e) {}
    }
}

if (import.meta.url === `file://${process.cwd().replace(/\\/g, '/')}/scripts/demoFix.mjs` || process.argv[1].endsWith('demoFix.mjs')) {
    main();
}
