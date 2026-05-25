// Builds the slim student object used by Handlebars cards.
export const buildStudent = (row) => {
    if (!row) return null;
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();

    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear();
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);

    return {
        fullName,
        studentAm: row.student_am,
        email: row.email,
        studyYear: String(studyYear),
    };
};

// Builds the richer student object used by the secretary's student-search dropdown.
export const buildStudentSearchResult = (row) => {
    if (!row) return null;

    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
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
        studyYear: studyYear ? `${studyYear}ο Έτος Σπουδών` : '-',
        department: 'Ηλεκτρολόγων Μηχανικών και Τεχνολογίας Υπολογιστών',
    };
};
