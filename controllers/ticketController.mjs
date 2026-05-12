import * as db from '../model/db.js';

export const renderCreateTicketPage = async (req, res) => {
    try {
        const studentId = Number(req.params.student_id);
        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }
        const row = await db.getStudentInfo(studentId);
        if (!row) {
            return res.status(404).send('Δεν βρέθηκε ο φοιτητής');
        }
        //student_id, full name, am, email, study_year, submitted_at
        res.render('createTicket', {
            title: 'Νέο Αίτημα',
            student: buildStudent(row), 
            studentId,
            groupedCategories: await createOptions()
        });
    } catch (error) {
        console.error('Error rendering create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};

let buildStudent = (row) => {
    if (!row) return null;
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim(); 
    // subtracts from the array any falsy values (null, undefined, empty string)
    //  and then joins the remaining parts with a space and trims any extra whitespace

    const enrollmentYear = row.enrollment_year;
    const currentYear = new Date().getFullYear(); 
    const studyYear = Math.max(1, currentYear - enrollmentYear + 1);

    const am = row.student_am;
    const email = row.email;
    // const submittedAt = new Date().toLocaleDateString('el-GR');
    return {
        fullName,
        studentAm: am,
        email,
        studyYear: String(studyYear)
        // submittedAt
    };
}

let createOptions = async () => {
    // purpose is to fetch flatCategories: [
    //     { id, theme, name },
    //     ...
    // ]
    // then group them by theme into groupedCategories: [
    //     { 
    //        themeName, 
    //        options: [
    //          { id, name }, ...
    //        ] 
    //     },
    //     ...
    // ]
 
    const flatCategories = await db.getAllCategories();

    const groupedCategories = flatCategories.reduce((acc, item) => {
        
        let group = acc.find(g => g.themeName === item.theme);
        
        if (!group) {
            group = { themeName: item.theme, options: [] };
            acc.push(group);
        }
        
        group.options.push({ id: item.id, name: item.name });
        return acc;
    }, []);
    return groupedCategories;
};

