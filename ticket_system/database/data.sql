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
        'student@uni.gr',
        '123456'
    ),
    (
        'Μαρία',
        'Αντωνίου',
        'secretary@uni.gr',
        '123456'
    ),
    (
        'Κώστας', 
        'Δημητρίου',
        'leader@uni.gr',
        '123456'
    );

INSERT INTO
    `STUDENT` (
        `student_am`,
        `type`,
        `for_id`
    )
VALUES ('1091234', 'undergrad', 1); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (FALSE, 2); 

INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES (TRUE, 3);

INSERT INTO
    `CATEGORY` (`name`)
VALUES ('Βεβαίωση Σπουδών'),
    ('Αναλυτική Βαθμολογία'),
    ('Εκπρόθεσμη Δήλωση'),
    ('Απώλεια Πάσο');