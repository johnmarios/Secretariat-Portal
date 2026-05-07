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
VALUES ('1091234', 'undergrad', 1, 1); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (FALSE, 2); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (TRUE, 3);

INSERT INTO
    `CATEGORY` (`name`)
VALUES ('Βεβαίωση Σπουδών'),
    ('Αναλυτική Βαθμολογία'),
    ('Εκπρόθεσμη Δήλωση'),
    ('Απώλεια Πάσο');