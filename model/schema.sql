SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `attachment	`, `message`, `ticket`, `student`, `secretary`, `user`, `category`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `user` (
    `user_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `first_name` varchar(100) NOT NULL,
    `last_name` varchar(100) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `password` varchar(255) NOT NULL,
    PRIMARY KEY (`user_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `category` (
    `category_id` varchar(255) NOT NULL UNIQUE,
    `category_theme` varchar(255) NOT NULL,
    `category_name` varchar(255) NOT NULL,
    PRIMARY KEY (`category_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `secretary` (
    `secretary_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `is_leader` boolean NOT NULL DEFAULT FALSE,
    `for_id` int NOT NULL,
    PRIMARY KEY (`secretary_id`),
    CONSTRAINT `SECRETARY_fk_user` FOREIGN KEY (`for_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `student` (
    `student_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `student_am` varchar(20) NOT NULL UNIQUE,
    `type` enum('undergrad', 'postgrad', 'phd') NOT NULL DEFAULT 'undergrad',
    `enrollment_year` int NOT NULL,
    `for_id` int NOT NULL,
    PRIMARY KEY (`student_id`),
    CONSTRAINT `STUDENT_fk_user` FOREIGN KEY (`for_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ticket` (
    `ticket_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `status` enum('open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated') NOT NULL DEFAULT 'open',
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `last_updated` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `resolved_at` timestamp NULL DEFAULT NULL,
    `for_student_id` int NOT NULL,
    `for_secretary_id` int DEFAULT NULL,
    `for_category_id` varchar(255) NOT NULL,
    PRIMARY KEY (`ticket_id`),
    CONSTRAINT `TICKET_fk_student` FOREIGN KEY (`for_student_id`) REFERENCES `student`(`student_id`),
    CONSTRAINT `TICKET_fk_secretary` FOREIGN KEY (`for_secretary_id`) REFERENCES `secretary`(`secretary_id`),
    CONSTRAINT `TICKET_fk_category` FOREIGN KEY (`for_category_id`) REFERENCES `category`(`category_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `message` (
    `message_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `message_subject` varchar(255),
    `message_description` text NOT NULL,
    `is_internal` boolean NOT NULL DEFAULT FALSE,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `for_user_id` int NOT NULL,
    `for_ticket_id` int NOT NULL,
    PRIMARY KEY (`message_id`),
    CONSTRAINT `MESSAGE_fk_user` FOREIGN KEY (`for_user_id`) REFERENCES `user`(`user_id`),
    CONSTRAINT `MESSAGE_fk_ticket` FOREIGN KEY (`for_ticket_id`) REFERENCES `ticket`(`ticket_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `attachment	` (
    `file_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `file_name` varchar(255) NOT NULL,
    `file_path` varchar(255) NOT NULL, 
    `file_size` int NOT NULL, 
    `file_type` varchar(50) NOT NULL,   
    `for_message_id` int DEFAULT NULL, 
    PRIMARY KEY (`file_id`),
    CONSTRAINT `ATTACHMENT_fk_message` FOREIGN KEY (`for_message_id`) REFERENCES `message`(`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Trigger: update ticket.last_updated when a new message is inserted
DROP TRIGGER IF EXISTS `trg_message_after_insert`;
CREATE TRIGGER `trg_message_after_insert`
AFTER INSERT ON `message`
FOR EACH ROW
BEGIN
    UPDATE `ticket` SET last_updated = NOW() WHERE ticket_id = NEW.for_ticket_id;
END;

