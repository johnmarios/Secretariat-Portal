SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `ATTACHMENT`;
TRUNCATE TABLE `MESSAGE`;
TRUNCATE TABLE `TICKET`;
TRUNCATE TABLE `STUDENT`;
TRUNCATE TABLE `SECRETARY`;
TRUNCATE TABLE `CATEGORY`;
TRUNCATE TABLE `USER`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. ΧΡΗΣΤΕΣ
INSERT INTO `USER` (`first_name`, `last_name`, `email`, `password`) VALUES 
('Μάνος', 'Παπαπέτρου', 'student1@uni.gr', '123456'),
('Μαρία', 'Αντωνίου', 'secretary1@uni.gr', '$2b$10$9r14DQ.KA4ePNiRqBMK6befE5lYf87ITpkZ51wXM7Iavv.kIgVtkS'),
('Κώστας', 'Δημητρίου', 'leader1@uni.gr', '123456');

-- 2. ΦΟΙΤΗΤΕΣ (Το for_id 1 αντιστοιχεί στον Μάνο)
-- Προσοχή: Το YEAR θέλει κανονική χρονολογία, π.χ. 2023
INSERT INTO `STUDENT` (`student_am`, `type`, `enrollment_year`, `for_id`) VALUES 
('1091234', 'undergrad', 2023, 1); 

-- 3. ΓΡΑΜΜΑΤΕΙΑ
INSERT INTO `SECRETARY` (`is_leader`, `for_id`) VALUES 
(FALSE, 2), -- Γραμματέας (Μαρία)
(TRUE, 3);  -- Προϊστάμενος (Κώστας)

-- 4. ΚΑΤΗΓΟΡΙΕΣ
INSERT INTO `CATEGORY` (`name`) VALUES 
('Βεβαίωση Σπουδών (Γενική Χρήση)'),
('Αναλυτική Βαθμολογία'),
('Θέματα Δηλώσεων Μαθημάτων'),
('Πρόβλημα με την Ακαδημαϊκή Ταυτότητα (Πάσο)');

-- 5. ΑΙΤΗΜΑΤΑ (TICKETS)
-- Για τον Μάνο (for_student_id = 1)
INSERT INTO `TICKET` (`subject`, `description`, `status`, `priority`, `for_student_id`, `for_category_id`, `for_secretary_id`, `created_at`, `resolved_at`) VALUES 
-- Αίτημα 1: Μη Εκχωρημένο (open, for_secretary_id = NULL)
('Θέλω βεβαίωση σπουδών', 'Παρακαλώ χρειάζομαι μια βεβαίωση σπουδών για την εφορία.', 'open', 'medium', 1, 1, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),

-- Αίτημα 2: Σε Εξέλιξη (in_progress, έχει ανατεθεί στη Μαρία secretary_id = 1)
('Δεν μπορώ να δηλώσω μάθημα', 'Στο σύστημα δεν μου εμφανίζεται το μάθημα επιλογής της κατεύθυνσής μου.', 'in_progress', 'high', 1, 3, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),

-- Αίτημα 3: Ολοκληρωμένο (closed, είχε ανατεθεί στη Μαρία secretary_id = 1)
('Αναλυτική Βαθμολογία', 'Χρειάζομαι την αναλυτική για το Erasmus.', 'closed', 'low', 1, 2, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),

-- Αίτημα 4: Εκκρεμές (pending, αναμένει απάντηση από φοιτητή)
('Πρόβλημα με φωτογραφία στο Πάσο', 'Απορρίφθηκε η φωτογραφία μου.', 'pending', 'medium', 1, 4, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL);

-- 6. ΜΗΝΥΜΑΤΑ
-- Μηνύματα για το Αίτημα 2 (Σε Εξέλιξη)
INSERT INTO `MESSAGE` (`message_txt`, `is_internal`, `for_user_id`, `for_ticket_id`) VALUES 
('Θα το ελέγξουμε άμεσα.', FALSE, 2, 2), -- Απάντηση Μαρίας
('Ευχαριστώ πολύ!', FALSE, 1, 2);          -- Απάντηση Μάνου

-- Εσωτερικό μήνυμα (Σημείωση) για το Αίτημα 4
INSERT INTO `MESSAGE` (`message_txt`, `is_internal`, `for_user_id`, `for_ticket_id`) VALUES 
('Ο φοιτητής ανέβασε θολή φωτογραφία. Του ζήτησα νέα.', TRUE, 2, 4);