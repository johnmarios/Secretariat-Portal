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
    //          { id, name, selected }, ...
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
        
        group.options.push({
            id: String(item.category_id),
            name: item.name,
        });
        return acc;
    }, []);
    return groupedCategories;
};

export const submitCreateTicket = async (req, res) => {
    try {
        const{ subject, description, category_id } = req.body;
        console.log(req.body);
        const files = req.files; // array of uploaded files (if any)
        const studentId = Number(req.params.student_id);
        const categoryId = String(category_id ?? '').trim();

        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή');
        }

        if (!categoryId) {
            return res.status(400).send('Επιλέξτε κατηγορία αιτήματος');
        }

        if (!subject?.trim() || !description?.trim()) {
            return res.status(400).send('Συμπληρώστε όλα τα υποχρεωτικά πεδία');
        }

        //save ticket info to the database
        const ticketId = await db.insertTicket({
            description: description,
            subject: subject,
            created_at: new Date(),
            for_student_id: studentId,
            for_category_id: categoryId
        });
        // save file paths to the database, into attachments table
        if (files && files.length > 0) {
            for (let file of files) {
                await db.saveAttachment({
                    ticketId: ticketId,
                    filePath: file.path,
                    fileName: file.originalname,
                    fileSize: file.size
                });
            }
        }
        res.redirect(`/create-ticket/ticket/student/${studentId}`);
    } catch (error) {
        console.error('Error submitting create ticket:', error);
        res.status(500).send("Upload failed: " + error.message);
    }
};

export const renderSecretaryViewTicketPage = async (req, res) => {
    try {
        const studentId = Number(req.params.student_id);
        const ticketId = Number(req.params.ticket_id);

        if (!Number.isInteger(studentId) || studentId < 1 || !Number.isInteger(ticketId) || ticketId < 1) {
            return res.status(400).send('Μη έγκυρος αριθμός φοιτητή ή αιτήματος');
        }
        res.render('secretaryViewTicket', {
            title: 'Λεπτομέρειες Αιτήματος',
            studentId,
            ticketId
        });
    } catch (error) {
        console.error('Error rendering secretary view ticket page:', error);    
        res.status(500).send('Internal Server Error');
    }
};