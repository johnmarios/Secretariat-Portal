import { fakerEL as faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dbPool from './db.js';

faker.seed(20260523);

const TARGET_STUDENTS = 1200;
const TARGET_TICKETS = 1000;

// const TARGET_STUDENTS = 500;  
// const TARGET_TICKETS = 250;   

// 8 rounds keeps seeding fast (~10s for ~1200 users) while staying compatible
// with the 10-round hashes produced by the register controller — bcrypt.compare
// works regardless of the cost factor used to create the hash.
const BCRYPT_ROUNDS = 8;

const ENROLLMENT_BOUNDS = {
    undergrad: { min: 2018, max: 2026 },
    postgrad: { min: 2022, max: 2026 },
    phd: { min: 2018, max: 2026 },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, '..', 'seed-credentials.txt');
const FILES_DIR = path.join(__dirname, '..', 'public', 'files');

// Conversation generation knobs
const MAX_MESSAGES_PER_TICKET = 10;
const INITIAL_ATTACHMENT_PROB = 0.4;
const REPLY_ATTACHMENT_PROB = 0.2;

// Filled in at startup from public/files
let fileBank = [];

async function loadFileBank() {
    try {
        const entries = await fs.readdir(FILES_DIR);
        const pdfs = entries.filter((name) => name.toLowerCase().endsWith('.pdf'));
        const stats = await Promise.all(
            pdfs.map(async (name) => {
                const stat = await fs.stat(path.join(FILES_DIR, name));
                return {
                    file_name: name,
                    file_path: `/public/files/${name}`,
                    file_size: stat.size,
                    file_type: 'application/pdf',
                };
            })
        );
        console.log(`Φορτώθηκαν ${stats.length} αρχεία από το ${path.relative(process.cwd(), FILES_DIR)}.`);
        return stats;
    } catch (error) {
        console.warn(`Δεν φορτώθηκαν αρχεία από ${FILES_DIR}: ${error.message}`);
        return [];
    }
}

// Mirrors the category rows in model/data.sql, so a fresh `npm run seed`
// is fully self-contained (no need to run data.sql).
const FALLBACK_CATEGORIES = [
    ['cert_enrollment', 'Βεβαιώσεις και Πιστοποιητικά', 'Βεβαίωση Σπουδών'],
    ['cert_transcript', 'Βεβαιώσεις και Πιστοποιητικά', 'Αναλυτική Βαθμολογία'],
    ['cert_military', 'Βεβαιώσεις και Πιστοποιητικά', 'Πιστοποιητικό για Στρατολογική Χρήση'],
    ['cert_tax', 'Βεβαιώσεις και Πιστοποιητικά', 'Βεβαίωση για Εφορία / Επίδομα Ενοικίου'],
    ['cert_diploma_copy', 'Βεβαιώσεις και Πιστοποιητικά', 'Αντίγραφο Πτυχίου / Διπλώματος'],
    ['acad_registration', 'Ακαδημαϊκά Θέματα', 'Πρόβλημα με την Εγγραφή / Ανανέωση'],
    ['acad_courses', 'Ακαδημαϊκά Θέματα', 'Θέματα Δηλώσεων Μαθημάτων'],
    ['acad_regarding', 'Ακαδημαϊκά Θέματα', 'Αίτηση Αναβαθμολόγησης'],
    ['acad_exam_review', 'Ακαδημαϊκά Θέματα', 'Επανεξέταση Μαθήματος'],
    ['acad_graduation', 'Ακαδημαϊκά Θέματα', 'Αίτηση για Ορκωμοσία / Λήψη Πτυχίου'],
    ['status_suspension', 'Φοιτητική Κατάσταση', 'Αναστολή Σπουδών'],
    ['status_deletion', 'Φοιτητική Κατάσταση', 'Αίτηση Διαγραφής από το Τμήμα'],
    ['status_transfer', 'Φοιτητική Κατάσταση', 'Θέματα Μετεγγραφών'],
    ['status_pass', 'Φοιτητική Κατάσταση', 'Πρόβλημα με την Ακαδημαϊκή Ταυτότητα (Πάσο)'],
    ['general_query', 'Λοιπά Θέματα', 'Γενικό Ερώτημα / Πληροφορίες'],
];

// Collected during seeding so we can dump everything to seed-credentials.txt
const credentials = {
    leader: null,
    secretaries: [],
    students: [],
};

function generatePassword() {
    return faker.internet.password({ length: 12, memorable: false }); //allows special chars for better security 
}

// random pick of item from array
const pick = (items) => items[faker.number.int({ min: 0, max: items.length - 1 })];

// picks a value from an array of { value, weight } objects based on weights
const pickWeighted = (items) => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = faker.number.int({ min: 1, max: total });
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
    }
    return items.at(-1).value; // fallback, should not happen if weights are correct
};

// generates an enrollment year based on student type, using ENROLLMENT_BOUNDS to ensure realistic values
function enrollmentYearFor(type) {
    const bounds = ENROLLMENT_BOUNDS[type] || ENROLLMENT_BOUNDS.undergrad;
    return faker.number.int({ min: bounds.min, max: bounds.max });
}

function studentEmail(am) {
    return `up${am}@ac.upatras.gr`;
}
async function resetDatabase() {
    await dbPool.query('SET FOREIGN_KEY_CHECKS = 0');
    await dbPool.query('TRUNCATE TABLE attachment');
    await dbPool.query('TRUNCATE TABLE message');
    await dbPool.query('TRUNCATE TABLE ticket');
    await dbPool.query('TRUNCATE TABLE student');
    await dbPool.query('TRUNCATE TABLE secretary');
    await dbPool.query('TRUNCATE TABLE category');
    await dbPool.query('TRUNCATE TABLE user');
    await dbPool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function insertUser(firstName, lastName, email, plainPassword) {
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    const [result] = await dbPool.query(
        'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword]
    );
    return result.insertId;
}

async function seedCategories() {
    for (const [id, theme, name] of FALLBACK_CATEGORIES) {
        await dbPool.query(
            'INSERT INTO category (category_id, category_theme, category_name) VALUES (?, ?, ?)',
            [id, theme, name]
        );
    }
    console.log(`Εισάχθηκαν ${FALLBACK_CATEGORIES.length} κατηγορίες.`);

    const [rows] = await dbPool.query(
        'SELECT category_id, category_theme, category_name FROM category'
    );
    return rows;
}

async function seedStaff() {
    const leaderPass = generatePassword();
    const secretaryPass = generatePassword();
    const demoStudentPass = generatePassword();

    const leaderId = await insertUser('Κώστας', 'Δημητρίου', 'leader1@uni.gr', leaderPass);
    const secretaryId = await insertUser('Μαρία', 'Αντωνίου', 'secretary1@uni.gr', secretaryPass);
    const demoStudentUserId = await insertUser('Μάνος', 'Παπαπέτρου', 'student1@uni.gr', demoStudentPass);
    // inserted a student here for debugging reasons 

    credentials.leader = {
        firstName: 'Κώστας',
        lastName: 'Δημητρίου',
        email: 'leader1@uni.gr',
        password: leaderPass,
    };
    credentials.secretaries.push({
        firstName: 'Μαρία',
        lastName: 'Αντωνίου',
        email: 'secretary1@uni.gr',
        password: secretaryPass,
    });
    credentials.students.push({
        firstName: 'Μάνος',
        lastName: 'Παπαπέτρου',
        email: 'student1@uni.gr',
        password: demoStudentPass,
        studentAm: '1091234',
        type: 'undergrad',
        enrollmentYear: 2019,
    });

    await dbPool.query('INSERT INTO secretary (is_leader, for_id) VALUES (?, ?)', [1, leaderId]);
    await dbPool.query('INSERT INTO secretary (is_leader, for_id) VALUES (?, ?)', [0, secretaryId]);

    await dbPool.query(
        'INSERT INTO student (student_am, type, enrollment_year, for_id) VALUES (?, ?, ?, ?)',
        ['1091234', 'undergrad', 2019, demoStudentUserId]
    );

    const extraSecretaries = [
        ['Ελένη', 'Γραμματεία', 'secretary2.seed@seeded.uni.gr'],
        ['Άννα', 'Γραμματεία', 'secretary3.seed@seeded.uni.gr'],
    ];

    const staff = [];
    for (const [firstName, lastName, email] of extraSecretaries) {
        const password = generatePassword();
        const userId = await insertUser(firstName, lastName, email, password);
        const [result] = await dbPool.query(
            'INSERT INTO secretary (is_leader, for_id) VALUES (?, ?)',
            [0, userId]
        );
        staff.push({ secretary_id: result.insertId, for_id: userId });

        credentials.secretaries.push({ firstName, lastName, email, password });
    }

    const [leaderRow] = await dbPool.query(
        'SELECT secretary_id, for_id FROM secretary WHERE for_id = ?',
        [leaderId]
    );
    const [secretaryRow] = await dbPool.query(
        'SELECT secretary_id, for_id FROM secretary WHERE for_id = ?',
        [secretaryId]
    );

    return {
        leader: leaderRow[0],
        secretaries: [secretaryRow[0], ...staff],
    };
}

async function seedStudents(count) {
    const students = [];

    for (let i = 0; i < count; i += 1) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const studentAm = String(1091235 + i);
        const email = studentEmail(studentAm);
        const password = generatePassword();
        const userId = await insertUser(firstName, lastName, email, password);

        const type = pickWeighted([
            { value: 'undergrad', weight: 85 },
            { value: 'postgrad', weight: 10 },
            { value: 'phd', weight: 5 },
        ]);

        const enrollmentYear = enrollmentYearFor(type);

        const [result] = await dbPool.query(
            'INSERT INTO student (student_am, type, enrollment_year, for_id) VALUES (?, ?, ?, ?)',
            [studentAm, type, enrollmentYear, userId]
        );

        students.push({
            student_id: result.insertId,
            for_id: userId,
            type,
            enrollment_year: enrollmentYear,
        });

        credentials.students.push({
            firstName,
            lastName,
            email,
            password,
            studentAm,
            type,
            enrollmentYear,
        });

        if ((i + 1) % 200 === 0 || i + 1 === count) {
            console.log(`Φοιτητές: ${i + 1}/${count}`);
        }
    }

    return students;
}

// Returns `count` Date objects in ascending order between start and end,
// roughly evenly spaced with some jitter. First element equals start.
//start: starting date, end: ending date, count: number of timestamps to generate
function generateMessageTimestamps(start, end, count) {
    if (count <= 1) return [start];

    const startMs = start.getTime();
    const endMs = Math.max(end.getTime(), startMs + 1); // defensive check to avoid zero or negative span
    const span = endMs - startMs;
    const step = span / count;

    const timestamps = [start];
    for (let k = 1; k < count; k += 1) {
        const base = startMs + step * k;
        const jitter = faker.number.float({ min: -0.3, max: 0.3 }) * step;
        const clamped = Math.max(startMs + 1, Math.min(endMs, base + jitter));
        timestamps.push(new Date(clamped));
    }
    timestamps.sort((a, b) => a - b);
    return timestamps;
}

async function insertMessageWithAttachment({
    subject,
    description,
    createdAt,
    userId,
    ticketId,
    isInternal,
    attachProb,
}) {
    const [result] = await dbPool.query(
        `INSERT INTO message (message_subject, message_description, created_at, for_user_id, for_ticket_id, is_internal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [subject, description, createdAt, userId, ticketId, isInternal ? 1 : 0]
    );
    const messageId = result.insertId;

    if (fileBank.length > 0 && faker.number.float({ min: 0, max: 1 }) < attachProb) {
        const file = pick(fileBank);
        await dbPool.query(
            `INSERT INTO attachment (file_name, file_path, file_size, file_type, for_message_id)
             VALUES (?, ?, ?, ?, ?)`,
            [file.file_name, file.file_path, file.file_size, file.file_type, messageId]
        );
    }

    return messageId;
}

async function seedTickets(count, students, staff, categories) {
    const categoryIds = categories.map((c) => c.category_id);
    const nonLeaderSecretaries = staff.secretaries;

    for (let i = 0; i < count; i += 1) {
        const student = pick(students);
        const categoryId = pick(categoryIds);
        const createdAt = faker.date.between({ from: '2024-01-01', to: new Date() });

        const status = pickWeighted([
            { value: 'open', weight: 45 },
            { value: 'in_progress', weight: 20 },
            { value: 'pending', weight: 15 },
            { value: 'resolved', weight: 10 },
            { value: 'closed', weight: 5 },
            { value: 'escalated', weight: 5 },
        ]);

        // Only non-open tickets are assigned to a secretary
        const secretary = status === 'open' ? null : pick(nonLeaderSecretaries);

        const resolvedAt = ['resolved', 'closed'].includes(status)
            ? faker.date.between({ from: createdAt, to: new Date() })
            : null;

        // ticket creation 
        const [ticketResult] = await dbPool.query(
            `INSERT INTO ticket (status, created_at, resolved_at, for_student_id, for_secretary_id, for_category_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [status, createdAt, resolvedAt, student.student_id, secretary?.secretary_id ?? null, categoryId]
        );
        const ticketId = ticketResult.insertId;

        // Conversation: initial student message, then alternating student/secretary replies.
        // 'open' tickets have only the initial message since no secretary has picked them up.

        //if status open: secretary: null
        const messageCount = secretary
            ? faker.number.int({ min: 1, max: MAX_MESSAGES_PER_TICKET })
            : 1;

        const conversationEnd = resolvedAt ?? new Date();
        const timestamps = generateMessageTimestamps(createdAt, conversationEnd, messageCount);

        for (let m = 0; m < messageCount; m += 1) {
            // the first (m=0 is from student, the next from secretary, then alternating. This creates more natural conversations)
            const isFromStudent = m % 2 === 0; // true/false 
            // based on this we configure the author of the message 
            const authorUserId = isFromStudent ? student.for_id : secretary.for_id;
            const ts = timestamps[m]; // every message has its own timestamp

            let subject;
            let description;
            let attachProb;

            if (m === 0) {
                subject = `Αίτημα για ${faker.lorem.words(3)}`;
                description = faker.lorem.sentences({ min: 2, max: 4 });
                attachProb = INITIAL_ATTACHMENT_PROB;
            } else {
                subject = '';  // Βάζουμε ένα κενό string αντί για null
                description = faker.lorem.sentences({ min: 1, max: 3 });
                attachProb = REPLY_ATTACHMENT_PROB;
            }

            await insertMessageWithAttachment({
                subject,
                description,
                createdAt: ts,
                userId: authorUserId,
                ticketId,
                isInternal: false,
                attachProb,
            });
        }

        // Escalated tickets get an additional internal note from the secretary
        if (status === 'escalated' && secretary) {
            await insertMessageWithAttachment({
                subject: 'Εσωτερικό σχόλιο',
                description: faker.lorem.paragraph(),
                createdAt: faker.date.soon({ days: 5, refDate: createdAt }),
                userId: secretary.for_id,
                ticketId,
                isInternal: true,
                attachProb: REPLY_ATTACHMENT_PROB,
            });
        }

        if ((i + 1) % 200 === 0 || i + 1 === count) {
            console.log(`Αιτήματα: ${i + 1}/${count}`);
        }
    }
}

async function printSummary() {
    const [[students]] = await dbPool.query('SELECT COUNT(*) AS n FROM student');
    const [[tickets]] = await dbPool.query('SELECT COUNT(*) AS n FROM ticket');
    const [[unassigned]] = await dbPool.query(
        'SELECT COUNT(*) AS n FROM ticket WHERE for_secretary_id IS NULL'
    );
    const [[escalated]] = await dbPool.query(
        `SELECT COUNT(DISTINCT for_ticket_id) AS n FROM message WHERE is_internal = 1`
    );
    const [[messages]] = await dbPool.query('SELECT COUNT(*) AS n FROM message');
    const [[attachments]] = await dbPool.query('SELECT COUNT(*) AS n FROM attachment');

    const [byType] = await dbPool.query(`
        SELECT type, MIN(enrollment_year) AS min_y, MAX(enrollment_year) AS max_y, COUNT(*) AS n
        FROM student GROUP BY type
    `);

    console.log('\n--- Σύνοψη ---');
    console.log(`Φοιτητές: ${students.n}, Αιτήματα: ${tickets.n}`);
    console.log(`Μη εκχωρημένα: ${unassigned.n}, Προωθημένα: ${escalated.n}`);
    console.log(`Μηνύματα: ${messages.n}, Επισυναπτόμενα: ${attachments.n}`);
    console.log('Έτος εισαγωγής ανά είδος φοιτητή:');
    for (const row of byType) {
        const bounds = ENROLLMENT_BOUNDS[row.type];
        console.log(`  ${row.type}: ${row.n} (${row.min_y}-${row.max_y}, αναμενόμενο: ${bounds.min}-${bounds.max})`);
    }
    console.log(`\nΟι κωδικοί έχουν αποθηκευτεί στο: ${CREDENTIALS_PATH}`);
}

function formatSection(title, count) {
    const heading = `${title} (${count})`;
    const underline = '='.repeat(heading.length);
    return `\n${heading}\n${underline}\n`;
}

async function writeCredentialsFile() {
    const lines = [];
    lines.push('Format: First Name | Last Name | email | password | AM | type | enrollment');

    lines.push(formatSection('LEADER', credentials.leader ? 1 : 0));
    if (credentials.leader) {
        const { firstName, lastName, email, password } = credentials.leader;
        lines.push(`${firstName} ${lastName} | ${email} | ${password}`);
    }

    lines.push(formatSection('SECRETARIES', credentials.secretaries.length));
    for (const s of credentials.secretaries) {
        lines.push(`${s.firstName} ${s.lastName} | ${s.email} | ${s.password}`);
    }

    lines.push(formatSection('STUDENTS', credentials.students.length));
    for (const s of credentials.students) {
        lines.push(
            `${s.firstName} ${s.lastName} | ${s.email} | ${s.password} | AM: ${s.studentAm} | ${s.type} | enroll: ${s.enrollmentYear}`
        );
    }

    await fs.writeFile(CREDENTIALS_PATH, lines.join('\n') + '\n', 'utf8');
}

async function main() {
    console.log('Αρχικοποίηση βάσης...\n');

    await resetDatabase();
    fileBank = await loadFileBank();
    const categories = await seedCategories();
    const staff = await seedStaff();
    const students = await seedStudents(TARGET_STUDENTS);
    await seedTickets(TARGET_TICKETS, students, staff, categories);
    await writeCredentialsFile();
    await printSummary();

    console.log('\nΟλοκληρώθηκε.');
}

main()
    .catch((error) => {
        console.error('Σφάλμα seed:', error);
        process.exitCode = 1;
    })
    .finally(() => dbPool.end());
