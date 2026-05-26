import { formatUserDisplayName } from './displayName.mjs';

// Maps STUDENT.type enum values ('undergrad' | 'postgrad' | 'phd') to the
// human-readable Greek labels used across the UI.
const STUDENT_TYPE_LABELS = {
    undergrad: 'Προπτυχιακός',
    postgrad: 'Μεταπτυχιακός',
    phd: 'Διδακτορικός',
};

const formatStudentType = (type) => STUDENT_TYPE_LABELS[type] || '-';

export const buildStudent = (row) => {
    if (!row) return null;
    const fullName = formatUserDisplayName(row, '');

    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear();
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);

    return {
        fullName,
        studentAm: row.student_am,
        email: row.email,
        studyYear: String(studyYear),
        type: formatStudentType(row.type),
    };
};

export const buildStudentSearchResult = (row) => {
    if (!row) return null;

    const fullName = formatUserDisplayName(row, '');
    const enrollmentYear = Number(row.enrollment_year);
    const currentYear = new Date().getFullYear();
    const studyYear = Number.isFinite(enrollmentYear)
        ? Math.max(1, currentYear - enrollmentYear + 1)
        : null;

    return {
        studentId: row.student_id,
        fullName,
        studentAm: row.student_am,
        email: row.email,
        studyYear: studyYear ? String(studyYear) : '-',
        department: 'Ηλεκτρολόγων Μηχανικών και Τεχνολογίας Υπολογιστών',
        type: formatStudentType(row.type),
    };
};
