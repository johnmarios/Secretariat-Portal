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
        `category_theme`,
        `category_name`
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

-- create message / attachment history

-- student: 
INSERT INTO
    `TICKET` (
        `for_student_id`,
        `for_secretary_id`,
        `for_category_id`
    )
VALUES (
        1,
        2,
        'cert_enrollment'
    );
INSERT INTO 
    `MESSAGE` (
        `message_subject`,
        `message_description`,
        `is_internal`,
        `created_at`,
        `for_user_id`,
        `for_ticket_id`
    )
VALUES (
        'Αίτηση για Βεβαίωση Σπουδών',
        'Καλημέρα, θα ήθελα να αιτηθώ για μια βεβαίωση σπουδών. Ευχαριστώ!',
        FALSE,
        CURRENT_TIMESTAMP,
        1,
        1
    );
-- update ticket after message to update last_updated timestamp
UPDATE `TICKET` SET `ticket_id` = 1 WHERE `ticket_id` = 1; 

INSERT INTO
    `ATTACHMENT` (
        `file_name`,
        `file_path`,
        `file_size`,
        `file_type`,
        `for_message_id`
    )
VALUES (
        '5-Expesss_js-1778663324970-305858068.pdf',
        '/public/uploads/5-Expesss_js-1778663324970-305858068.pdf',
        1278976,
        'application/pdf',
        1
    );
INSERT INTO
    `ATTACHMENT` (
        `file_name`,
        `file_path`,
        `file_size`,
        `file_type`,
        `for_message_id`
    )
VALUES (
        '-_-8-1778663325070-907030677.pdf',
        '/public/uploads/-_-8-1778663325070-907030677.pdf',
        1294336,
        'application/pdf',
        1
    );

-- secretary:

INSERT INTO 
    `MESSAGE` (
        `message_subject`,
        `message_description`,
        `is_internal`,
        `created_at`,
        `for_user_id`,
        `for_ticket_id`
    )
VALUES (
        'Απάντηση στην αίτηση για Βεβαίωση Σπουδών',
        'Ευχαριστούμε για την αίτησή σας. Θα την επεξεργαστούμε το συντομότερο δυνατόν.',
        FALSE,
        CURRENT_TIMESTAMP,
        2,
        1
    );
UPDATE `TICKET` SET `ticket_id` = 1 WHERE `ticket_id` = 1;

INSERT INTO
    `ATTACHMENT` (
        `file_name`,
        `file_path`,
        `file_size`,
        `file_type`,
        `for_message_id`
    )
VALUES (
        '8--1778663325017-422065627.pdf',
        '/public/uploads/8--1778663325017-422065627.pdf',
        1687552,
        'application/pdf',
        2
    );
INSERT INTO
    `ATTACHMENT` (
        `file_name`,
        `file_path`,
        `file_size`,
        `file_type`,
        `for_message_id`
    )
VALUES (
        'CK802_5b-database-connection-1778663324826-210603662.pdf',
        '/public/uploads/CK802_5b-database-connection-1778663324826-210603662.pdf',
        3418112,
        'application/pdf',
        2
    );

-- student response : 
INSERT INTO 
    `MESSAGE` (
        `message_subject`,
        `message_description`,
        `is_internal`,
        `created_at`,
        `for_user_id`,
        `for_ticket_id`
    )
VALUES (
        NULL,
        'Ευχαριστώ πολύ για την ενημέρωση. Περιμένω νέα σας.',
        FALSE,
        CURRENT_TIMESTAMP,
        1,
        1
    );
UPDATE `TICKET` SET `ticket_id` = 1 WHERE `ticket_id` = 1;
INSERT INTO
    `ATTACHMENT` (
        `file_name`,
        `file_path`,
        `file_size`,
        `file_type`,
        `for_message_id`
    )
VALUES (
        'CK802_5b-database-connection-1778663324826-210603662.pdf',
        '/public/uploads/CK802_5b-database-connection-1778663324826-210603662.pdf',
        3418112,
        'application/pdf',
        3
    );

