CREATE TABLE IF NOT EXISTS `USER` (
    `user_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `first_name` varchar(100) NOT NULL,
    `last_name` varchar(100) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `password` varchar(255) NOT NULL,
    PRIMARY KEY (`user_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `CATEGORY` (
    `category_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `name` varchar(255) NOT NULL,
    PRIMARY KEY (`category_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `SECRETARY` (
    `secretary_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `is_leader` boolean NOT NULL DEFAULT FALSE,
    `for_id` int NOT NULL,
    PRIMARY KEY (`secretary_id`),
    CONSTRAINT `SECRETARY_fk_user` FOREIGN KEY (`for_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `STUDENT` (
    `student_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `student_am` varchar(20) NOT NULL UNIQUE,
    `type` enum('undergrad', 'postgrad', 'phd') NOT NULL DEFAULT 'undergrad',
    `enrollment_year` YEAR NOT NULL,
    `for_id` int NOT NULL,
    PRIMARY KEY (`student_id`),
    CONSTRAINT `STUDENT_fk_user` FOREIGN KEY (`for_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `TICKET` (
    `ticket_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `subject` varchar(255) NOT NULL,
    `description` text NOT NULL,
    `status` enum('open', 'in_progress', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `file_path` varchar(255) DEFAULT NULL,
    `priority` enum('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `last_updated` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `resolved_at` timestamp NULL DEFAULT NULL,
    `for_student_id` int NOT NULL,
    `for_secretary_id` int DEFAULT NULL,
    `for_category_id` int NOT NULL,
    PRIMARY KEY (`ticket_id`),
    CONSTRAINT `TICKET_fk_student` FOREIGN KEY (`for_student_id`) REFERENCES `STUDENT`(`student_id`),
    CONSTRAINT `TICKET_fk_secretary` FOREIGN KEY (`for_secretary_id`) REFERENCES `SECRETARY`(`secretary_id`),
    CONSTRAINT `TICKET_fk_category` FOREIGN KEY (`for_category_id`) REFERENCES `CATEGORY`(`category_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `MESSAGE` (
    `message_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `message_txt` text NOT NULL,
    `is_internal` boolean NOT NULL DEFAULT FALSE,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `for_user_id` int NOT NULL,
    `for_ticket_id` int NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `MESSAGE_fk_user` FOREIGN KEY (`for_user_id`) REFERENCES `USER`(`user_id`),
    CONSTRAINT `MESSAGE_fk_ticket` FOREIGN KEY (`for_ticket_id`) REFERENCES `TICKET`(`ticket_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ATTACHMENT` (
    `attachment_id` int AUTO_INCREMENT NOT NULL UNIQUE,
    `file_name` varchar(255) NOT NULL,
    `file_path` varchar(255) NOT NULL, 
    `file_size` int NOT NULL, 
    `uploaded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `for_ticket_id` int DEFAULT NULL, 
    `for_message_id` int DEFAULT NULL, 
    PRIMARY KEY (`attachment_id`),
    CONSTRAINT `ATTACHMENT_fk_ticket` FOREIGN KEY (`for_ticket_id`) REFERENCES `TICKET`(`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `ATTACHMENT_fk_message` FOREIGN KEY (`for_message_id`) REFERENCES `MESSAGE`(`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB;