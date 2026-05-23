import { faker } from '@faker-js/faker';
import dbPool from './db.js';

faker.seed(20260523);

const TARGET_STUDENTS = 1200;
const TARGET_TICKETS = 1000;

const ENROLLMENT_BOUNDS = {
    undergrad: { min: 2018, max: 2026 },
    postgrad: { min: 2022, max: 2026 },
    phd: { min: 2018, max: 2026 },
};

const CATEGORIES = [
    ['cert_enrollment', 'Βεβαιώσεις και Πιστοποιητικά', 'Βεβαίωση Σπουδών'],
    ['cert_transcript', 'Βεβαιώσεις και Πιστοποιητικά', 'Αναλυτική Βαθμολογία'],
    ['acad_registration', 'Ακαδημαϊκά Θέματα', 'Πρόβλημα με την Εγγραφή / Ανανέωση'],
    ['acad_courses', 'Ακαδημαϊκά Θέματα', 'Θέματα Δηλώσεων Μαθημάτων'],
    ['status_suspension', 'Φοιτητική Κατάσταση', 'Αναστολή Σπουδών'],
    ['general_query', 'Λοιπά Θέματα', 'Γενικό Ερώτημα / Πληροφορίες'],
];

const pick = (items) => items[faker.number.int({ min: 0, max: items.length - 1 })];

const pickWeighted = (items) => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = faker.number.int({ min: 1, max: total });
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
    }
    return items.at(-1).value;
};

function enrollmentYearFor(type) {
    const bounds = ENROLLMENT_BOUNDS[type] || ENROLLMENT_BOUNDS.undergrad;
    return faker.number.int({ min: bounds.min, max: bounds.max });
}

function studentEmail(firstName, lastName, index) {
    const slug = `${firstName}.${lastName}.${index}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '');
    return `${slug}@seeded.uni.gr`;
}

async function resetDatabase() {
    await dbPool.query('SET FOREIGN_KEY_CHECKS = 0');
    await dbPool.query('TRUNCATE TABLE ATTACHMENT');
    await dbPool.query('TRUNCATE TABLE MESSAGE');
    await dbPool.query('TRUNCATE TABLE TICKET');
    await dbPool.query('TRUNCATE TABLE STUDENT');
    await dbPool.query('TRUNCATE TABLE SECRETARY');
    await dbPool.query('TRUNCATE TABLE CATEGORY');
    await dbPool.query('TRUNCATE TABLE USER');
    await dbPool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function insertUser(firstName, lastName, email, password = '123456') {
    const [result] = await dbPool.query(
        'INSERT INTO USER (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, password]
    );
    return result.insertId;
}

async function seedCategories() {
    for (const [id, theme, name] of CATEGORIES) {
        await dbPool.query(
            'INSERT INTO CATEGORY (category_id, category_theme, category_name) VALUES (?, ?, ?)',
            [id, theme, name]
        );
    }
}

async function seedStaff() {
    const leaderId = await insertUser('Κώστας', 'Δημητρίου', 'leader1@uni.gr');
    const secretaryId = await insertUser('Μαρία', 'Αντωνίου', 'secretary1@uni.gr');
    const demoStudentUserId = await insertUser('Μάνος', 'Παπαπέτρου', 'student1@uni.gr');

    await dbPool.query('INSERT INTO SECRETARY (is_leader, for_id) VALUES (?, ?)', [1, leaderId]);
    await dbPool.query('INSERT INTO SECRETARY (is_leader, for_id) VALUES (?, ?)', [0, secretaryId]);

  await dbPool.query(
        'INSERT INTO STUDENT (student_am, type, enrollment_year, for_id) VALUES (?, ?, ?, ?)',
        ['1091234', 'undergrad', 2019, demoStudentUserId]
    );

    const extraSecretaries = [
        ['Ελένη', 'Γραμματεία', 'secretary2.seed@seeded.uni.gr'],
        ['Άννα', 'Γραμματεία', 'secretary3.seed@seeded.uni.gr'],
    ];

    const staff = [];
    for (const [firstName, lastName, email] of extraSecretaries) {
        const userId = await insertUser(firstName, lastName, email, 'password123');
        const [result] = await dbPool.query(
            'INSERT INTO SECRETARY (is_leader, for_id) VALUES (?, ?)',
            [0, userId]
        );
        staff.push({ secretary_id: result.insertId, for_id: userId });
    }

    const [leaderRow] = await dbPool.query(
        'SELECT secretary_id, for_id FROM SECRETARY WHERE for_id = ?',
        [leaderId]
    );
    const [secretaryRow] = await dbPool.query(
        'SELECT secretary_id, for_id FROM SECRETARY WHERE for_id = ?',
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
        const userId = await insertUser(firstName, lastName, studentEmail(firstName, lastName, i + 1), 'password123');

        const type = pickWeighted([
            { value: 'undergrad', weight: 85 },
            { value: 'postgrad', weight: 10 },
            { value: 'phd', weight: 5 },
        ]);

        const enrollmentYear = enrollmentYearFor(type);
        const studentAm = String(20250001 + i);

        const [result] = await dbPool.query(
            'INSERT INTO STUDENT (student_am, type, enrollment_year, for_id) VALUES (?, ?, ?, ?)',
            [studentAm, type, enrollmentYear, userId]
        );

        students.push({
            student_id: result.insertId,
            for_id: userId,
            type,
            enrollment_year: enrollmentYear,
        });

        if ((i + 1) % 200 === 0 || i + 1 === count) {
            console.log(`Φοιτητές: ${i + 1}/${count}`);
        }
    }

    return students;
}

async function seedTickets(count, students, staff) {
    const categoryIds = CATEGORIES.map(([id]) => id);
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

        const secretary = status === 'open' ? null : pick(nonLeaderSecretaries);
        const resolvedAt = ['resolved', 'closed'].includes(status)
            ? faker.date.between({ from: createdAt, to: new Date() })
            : null;

        const [ticketResult] = await dbPool.query(
            `INSERT INTO TICKET (status, created_at, resolved_at, for_student_id, for_secretary_id, for_category_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [status, createdAt, resolvedAt, student.student_id, secretary?.secretary_id ?? null, categoryId]
        );

        const ticketId = ticketResult.insertId;
        const subject = `Αίτημα για ${faker.lorem.words(3)}`;
        const description = `${faker.lorem.sentences({ min: 2, max: 4 })}`;

        await dbPool.query(
            `INSERT INTO MESSAGE (message_subject, message_description, created_at, for_user_id, for_ticket_id, is_internal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [subject, description, createdAt, student.for_id, ticketId, 0]
        );

        if (status === 'escalated' && secretary) {
            await dbPool.query(
                `INSERT INTO MESSAGE (message_subject, message_description, created_at, for_user_id, for_ticket_id, is_internal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    'Εσωτερικό σχόλιο',
                    faker.lorem.paragraph(),
                    faker.date.soon({ days: 5, refDate: createdAt }),
                    secretary.for_id,
                    ticketId,
                    1,
                ]
            );
        }

        if ((i + 1) % 200 === 0 || i + 1 === count) {
            console.log(`Αιτήματα: ${i + 1}/${count}`);
        }
    }
}

async function printSummary() {
    const [[students]] = await dbPool.query('SELECT COUNT(*) AS n FROM STUDENT');
    const [[tickets]] = await dbPool.query('SELECT COUNT(*) AS n FROM TICKET');
    const [[unassigned]] = await dbPool.query(
        'SELECT COUNT(*) AS n FROM TICKET WHERE for_secretary_id IS NULL'
    );
    const [[escalated]] = await dbPool.query(
        `SELECT COUNT(DISTINCT for_ticket_id) AS n FROM MESSAGE WHERE is_internal = 1`
    );

    const [byType] = await dbPool.query(`
        SELECT type, MIN(enrollment_year) AS min_y, MAX(enrollment_year) AS max_y, COUNT(*) AS n
        FROM STUDENT GROUP BY type
    `);

    console.log('\n--- Σύνοψη ---');
    console.log(`Φοιτητές: ${students.n}, Αιτήματα: ${tickets.n}`);
    console.log(`Μη εκχωρημένα: ${unassigned.n}, Προωθημένα (εσωτερικό μήνυμα): ${escalated.n}`);
    console.log('Enrollment year ανά τύπο:');
    for (const row of byType) {
        const bounds = ENROLLMENT_BOUNDS[row.type];
        console.log(`  ${row.type}: ${row.n} (${row.min_y}-${row.max_y}, όρια ${bounds.min}-${bounds.max})`);
    }
    console.log('\nDemo logins (password: 123456):');
    console.log('  student1@uni.gr | secretary1@uni.gr | leader1@uni.gr');
}

async function main() {
    console.log('Αρχικοποίηση βάσης...\n');

    await resetDatabase();
    await seedCategories();
    const staff = await seedStaff();
    const students = await seedStudents(TARGET_STUDENTS);
    await seedTickets(TARGET_TICKETS, students, staff);
    await printSummary();

    console.log('\nΟλοκληρώθηκε.');
}

main()
    .catch((error) => {
        console.error('Σφάλμα seed:', error);
        process.exitCode = 1;
    })
    .finally(() => dbPool.end());
