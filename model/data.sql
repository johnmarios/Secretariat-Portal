SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `ATTACHMENT`;
TRUNCATE TABLE `MESSAGE`;
TRUNCATE TABLE `TICKET`;
TRUNCATE TABLE `STUDENT`;
TRUNCATE TABLE `SECRETARY`;
TRUNCATE TABLE `CATEGORY`;
TRUNCATE TABLE `USER`;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO
    `USER` (
        `first_name`,
        `last_name`,
        `email`,
        `password`
    )
VALUES (
        'Μάνος', 
        'Παπαπέτρου',
        'student1@uni.gr',
        '123456'
    ),
    (
        'Μαρία',
        'Αντωνίου',
        'secretary1@uni.gr',
        '123456'
    ),
    (
        'Κώστας', 
        'Δημητρίου',
        'leader1@uni.gr',
        '123456'
    );

INSERT INTO
    `STUDENT` (
        `student_am`,
        `type`,
        `enrollment_year`,
        `for_id`
    )
VALUES ('1091234', 'undergrad', '2019', 1); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (FALSE, 2); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (TRUE, 3);

INSERT INTO
    `CATEGORY` (
        `category_id`,
        `theme`,
        `name`
    )
VALUES 
    ('cert_enrollment','Βεβαιώσεις και Πιστοποιητικά', 'Βεβαίωση Σπουδών'),
    ('cert_transcript','Βεβαιώσεις και Πιστοποιητικά', 'Αναλυτική Βαθμολογία'),
    ('cert_military','Βεβαιώσεις και Πιστοποιητικά', 'Πιστοποιητικό για Στρατολογική Χρήση'),
    ('cert_tax','Βεβαιώσεις και Πιστοποιητικά', 'Βεβαίωση για Εφορία / Επίδομα Ενοικίου'),
    ('cert_diploma_copy','Βεβαιώσεις και Πιστοποιητικά', 'Αντίγραφο Πτυχίου / Διπλώματος'),

    ('acad_registration','Ακαδημαϊκά Θέματα', 'Πρόβλημα με την Εγγραφή / Ανανέωση'),
    ('acad_courses','Ακαδημαϊκά Θέματα', 'Θέματα Δηλώσεων Μαθημάτων'),
    ('acad_regarding','Ακαδημαϊκά Θέματα', 'Αίτηση Αναβαθμολόγησης'),
    ('acad_exam_review','Ακαδημαϊκά Θέματα', 'Επανεξέταση Μαθήματος'),
    ('acad_graduation','Ακαδημαϊκά Θέματα', 'Αίτηση για Ορκωμοσία / Λήψη Πτυχίου'),

    ('status_suspension','Φοιτητική Κατάσταση', 'Αναστολή Σπουδών'),
    ('status_deletion','Φοιτητική Κατάσταση', 'Αίτηση Διαγραφής από το Τμήμα'),
    ('status_transfer','Φοιτητική Κατάσταση', 'Θέματα Μετεγγραφών'),
    ('status_pass','Φοιτητική Κατάσταση', 'Πρόβλημα με την Ακαδημαϊκή Ταυτότητα (Πάσο)'),

    ('general_query','Λοιπά Θέματα', 'Γενικό Ερώτημα / Πληροφορίες');