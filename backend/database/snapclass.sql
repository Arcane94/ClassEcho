-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 08, 2026 at 10:03 PM
-- Server version: 8.0.44
-- PHP Version: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `snapclass_server`
--

-- --------------------------------------------------------

--
-- Table structure for table `active_section`
--

DROP TABLE IF EXISTS `active_section`;
CREATE TABLE IF NOT EXISTS `active_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_id` (`section_id`,`user_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `assignment`
--

DROP TABLE IF EXISTS `assignment`;
CREATE TABLE IF NOT EXISTS `assignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `status` enum('Active','Inactive','Archived') NOT NULL,
  `start_date` date NOT NULL,
  `due_date` datetime NOT NULL,
  `rubric_id` int DEFAULT NULL,
  `environment` varchar(50) NOT NULL COMMENT 'The programming environment of the assignment',
  `assignment_file_name` varchar(255) DEFAULT NULL COMMENT 'The name of the assignment file',
  `instruction_file_name` varchar(255) DEFAULT NULL COMMENT 'The name of instruction pdf file',
  `level` int NOT NULL DEFAULT '1' COMMENT 'The difficulty level of the assignment',
  `is_differentiated` int NOT NULL DEFAULT '0',
  `short_response_document` longtext COMMENT 'The document to be uploaded for short response',
  `short_response_file_name` varchar(255) DEFAULT NULL COMMENT 'The name of the short response file',
  `grade_point_maximum` decimal(5,2) DEFAULT NULL COMMENT 'The maximum number of points for a short response assignment',
  `short_response_link` varchar(255) DEFAULT NULL COMMENT 'The link to the google drive short response assignment',
  `type` varchar(255) DEFAULT NULL COMMENT 'The type of assignment',
  `user_id` int NOT NULL COMMENT 'Creator of the assignment',
  `review` varchar(100) DEFAULT NULL,
  `peer_self_review_start_date` date DEFAULT NULL,
  `peer_self_review_due_date` datetime DEFAULT NULL,
  `instructions` varchar(255) DEFAULT NULL COMMENT 'The text content of assignment instructions',
  `is_netsblox` bit(1) DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `rubric_id` (`rubric_id`),
  KEY `assignment_ibfk_2` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `assignments_in_lesson`
--

DROP TABLE IF EXISTS `assignments_in_lesson`;
CREATE TABLE IF NOT EXISTS `assignments_in_lesson` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lesson_id` (`lesson_id`,`assignment_id`),
  KEY `assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `assignments_in_section`
--

DROP TABLE IF EXISTS `assignments_in_section`;
CREATE TABLE IF NOT EXISTS `assignments_in_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int DEFAULT NULL,
  `assignment_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_id` (`section_id`,`assignment_id`),
  KEY `assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_overall_grade_total`
--

DROP TABLE IF EXISTS `assignment_overall_grade_total`;
CREATE TABLE IF NOT EXISTS `assignment_overall_grade_total` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_feedback` varchar(511) DEFAULT NULL,
  `grade_total` decimal(5,2) DEFAULT NULL,
  `point_for_category` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `assignment_id` int DEFAULT NULL,
  `teacher_feedback` longtext COMMENT 'The document to be uploaded for teacher feedback',
  `teacher_feedback_file_name` varchar(255) DEFAULT NULL COMMENT 'The name of the teacher feedback file',
  `score_adjustment` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `point_for_category` (`point_for_category`),
  KEY `user_id` (`user_id`),
  KEY `assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `backup`
--

DROP TABLE IF EXISTS `backup`;
CREATE TABLE IF NOT EXISTS `backup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submission_code` mediumtext NOT NULL,
  `assignment_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `datetime` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `learning_objective` varchar(255) NOT NULL,
  `min_point` int DEFAULT NULL,
  `max_point` int DEFAULT NULL,
  `point_scale` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `category_for_rubric`
--

DROP TABLE IF EXISTS `category_for_rubric`;
CREATE TABLE IF NOT EXISTS `category_for_rubric` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rubric_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rubric_id` (`rubric_id`,`category_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `category_for_teacher`
--

DROP TABLE IF EXISTS `category_for_teacher`;
CREATE TABLE IF NOT EXISTS `category_for_teacher` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `code_for_assignments`
--

DROP TABLE IF EXISTS `code_for_assignments`;
CREATE TABLE IF NOT EXISTS `code_for_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `section_id` int DEFAULT NULL,
  `type` int NOT NULL COMMENT '0 = solution, 1 = starter/general, 2 = starter/beginner, 3 = starter/intermediate, 4 = starter/advanced',
  `code` mediumtext,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `section_id` (`section_id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `consent`
--

DROP TABLE IF EXISTS `consent`;
CREATE TABLE IF NOT EXISTS `consent` (
  `consent_id` int NOT NULL AUTO_INCREMENT COMMENT 'A unique identifier for the assignment.',
  `user_id` int DEFAULT NULL COMMENT 'A unique identifier that follows a user',
  `consent_date` datetime NOT NULL COMMENT 'The name of the assignment file',
  `consent` tinyint(1) NOT NULL COMMENT 'If we have student consent to look at the data',
  PRIMARY KEY (`consent_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS `course`;
CREATE TABLE IF NOT EXISTS `course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_user_name` (`user_id`,`name`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `emoji_reaction`
--

DROP TABLE IF EXISTS `emoji_reaction`;
CREATE TABLE IF NOT EXISTS `emoji_reaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `section_id` int DEFAULT NULL,
  `assignment_id` int DEFAULT NULL,
  `emoji_key` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_section_id` (`section_id`),
  KEY `idx_assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `assignment_name` varchar(255) NOT NULL,
  `assignment_id` int NOT NULL,
  `student_username` varchar(255) NOT NULL,
  `student_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `environment` varchar(255) NOT NULL,
  `likes` mediumtext,
  `smiles` mediumtext,
  `gallery_code` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `help`
--

DROP TABLE IF EXISTS `help`;
CREATE TABLE IF NOT EXISTS `help` (
  `helpreq_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `submission_code` mediumtext,
  `assignment_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`helpreq_id`),
  KEY `idx_help_user_id` (`user_id`),
  KEY `idx_help_assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `helpers`
--

DROP TABLE IF EXISTS `helpers`;
CREATE TABLE IF NOT EXISTS `helpers` (
  `id` int DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `preferred_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `helper` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson`
--

DROP TABLE IF EXISTS `lesson`;
CREATE TABLE IF NOT EXISTS `lesson` (
  `id` int NOT NULL AUTO_INCREMENT,
  `public` tinyint(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  `grade` int NOT NULL,
  `learning_objective` enum('Science','Math','ELA','Social Studies','Loops','Conditionals','Abstraction','Lists','Variables','Interdisciplinary','Other') NOT NULL,
  `level` varchar(255) NOT NULL,
  `description` text,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `event_type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `mc_images`
--

DROP TABLE IF EXISTS `mc_images`;
CREATE TABLE IF NOT EXISTS `mc_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `question_id` int NOT NULL,
  `img_data` mediumtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `mc_questions`
--

DROP TABLE IF EXISTS `mc_questions`;
CREATE TABLE IF NOT EXISTS `mc_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `mc_question_data` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mc_questions_ibfk_1` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `mc_student_submit`
--

DROP TABLE IF EXISTS `mc_student_submit`;
CREATE TABLE IF NOT EXISTS `mc_student_submit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `mc_submission_data` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `peer_review`
--

DROP TABLE IF EXISTS `peer_review`;
CREATE TABLE IF NOT EXISTS `peer_review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `due_date` date NOT NULL,
  `reviewer_id` int NOT NULL,
  `assignment_id` int NOT NULL,
  `section_id` int NOT NULL,
  `reviewee_id` int NOT NULL,
  `rubric_id` int NOT NULL,
  `self` int NOT NULL,
  `is_submitted` int NOT NULL,
  `feedback` varchar(255) NOT NULL,
  `score` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `peer_review_ibfk_1` (`reviewer_id`),
  KEY `peer_review_ibfk_2` (`assignment_id`),
  KEY `peer_review_ibfk_3` (`section_id`),
  KEY `peer_review_ibfk_4` (`reviewee_id`),
  KEY `peer_review_ibfk_5` (`rubric_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `points_for_category`
--

DROP TABLE IF EXISTS `points_for_category`;
CREATE TABLE IF NOT EXISTS `points_for_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `points` decimal(5,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `preferences_for_teacher`
--

DROP TABLE IF EXISTS `preferences_for_teacher`;
CREATE TABLE IF NOT EXISTS `preferences_for_teacher` (
  `teacher_id` int NOT NULL,
  `homepage_default_view` int DEFAULT '-1',
  `homepage_default_section` int DEFAULT '-1',
  PRIMARY KEY (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
CREATE TABLE IF NOT EXISTS `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` enum('Teacher','Student','Admin') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `role_for_user`
--

DROP TABLE IF EXISTS `role_for_user`;
CREATE TABLE IF NOT EXISTS `role_for_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `rubric`
--

DROP TABLE IF EXISTS `rubric`;
CREATE TABLE IF NOT EXISTS `rubric` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_template` tinyint(1) NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `school`
--

DROP TABLE IF EXISTS `school`;
CREATE TABLE IF NOT EXISTS `school` (
  `school_id` varchar(255) NOT NULL COMMENT 'A unique identifier for the school, nces id for public k-12 schools',
  `school_name` varchar(255) NOT NULL COMMENT 'A front facing name for the school',
  `street_address` varchar(255) NOT NULL COMMENT 'The street address of the school',
  `city` varchar(255) NOT NULL COMMENT 'The city where the school is in',
  `county` varchar(255) NOT NULL COMMENT 'The county the school is in',
  `state` varchar(255) DEFAULT NULL COMMENT 'The state the school is in, acronym ',
  `zip` varchar(10) DEFAULT NULL COMMENT 'The zip code of the school',
  PRIMARY KEY (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `section`
--

DROP TABLE IF EXISTS `section`;
CREATE TABLE IF NOT EXISTS `section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_number` varchar(4) NOT NULL,
  `course_id` int DEFAULT NULL,
  `last_modified` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_course_section_number` (`course_id`,`section_number`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `section_seat`
--

DROP TABLE IF EXISTS `section_seat`;
CREATE TABLE IF NOT EXISTS `section_seat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `type` enum('seat','desk') NOT NULL DEFAULT 'seat',
  `x` int NOT NULL,
  `y` int NOT NULL,
  `student_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_section_seat_section_id` (`section_id`),
  KEY `idx_section_seat_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `section_seating_chart`
--

DROP TABLE IF EXISTS `section_seating_chart`;
CREATE TABLE IF NOT EXISTS `section_seating_chart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_section_chart` (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students_in_section`
--

DROP TABLE IF EXISTS `students_in_section`;
CREATE TABLE IF NOT EXISTS `students_in_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `group` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_id` (`section_id`,`user_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `submission`
--

DROP TABLE IF EXISTS `submission`;
CREATE TABLE IF NOT EXISTS `submission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submission_code` mediumtext,
  `assignment_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `is_submitted` tinyint(1) NOT NULL,
  `level` enum('any','beginner','intermediate','advanced') NOT NULL DEFAULT 'any',
  `short_response` longtext COMMENT 'The document to be uploaded for short response',
  `short_response_file_name` varchar(255) DEFAULT NULL COMMENT 'The name of the short response file',
  `short_response_link` varchar(255) DEFAULT NULL COMMENT 'The link to the google drive short response assignment',
  `feedback` text COMMENT 'The instructor feedback',
  `is_netsblox` bit(1) DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `assignment_id` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `trace`
--

DROP TABLE IF EXISTS `trace`;
CREATE TABLE IF NOT EXISTS `trace` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'A unique row ID for this event.',
  `time` datetime NOT NULL COMMENT 'The client-side time at which the event was logged. This may be inaccurate if the browser clock was wrong.',
  `serverTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'An auto-generated timestamp when this row was created, which may be after the event actually occurred.',
  `message` varchar(64) NOT NULL COMMENT 'The type of event that occurred.',
  `data` text NOT NULL COMMENT 'Any additional parameters associated with the event.',
  `assignmentID` varchar(40) NOT NULL COMMENT 'The ID of the assignment being worked on.',
  `sectionID` varchar(40) NOT NULL COMMENT 'The ID of the section currently being worked on.',
  `userID` varchar(255) DEFAULT NULL COMMENT 'A hashed ID for the user.',
  `projectID` varchar(40) NOT NULL COMMENT 'A GUID for the Snap project.',
  `sessionID` varchar(40) NOT NULL COMMENT 'A GUID for the browser session.',
  `browserID` varchar(40) NOT NULL COMMENT 'A GUID for the browser.',
  `code` mediumtext NOT NULL COMMENT 'A snapshot of the xml of the Snap project, if changed from the last log.',
  PRIMARY KEY (`id`),
  KEY `assignmentID` (`assignmentID`),
  KEY `sectionID` (`sectionID`),
  KEY `userID` (`userID`),
  KEY `message` (`message`),
  KEY `projectID` (`projectID`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `preferred_name` varchar(255) DEFAULT NULL,
  `yob` int DEFAULT NULL,
  `account_type` int DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `email` varchar(255) DEFAULT NULL COMMENT 'email address to reset password',
  `school_id` varchar(255) DEFAULT NULL COMMENT 'NCES school id or a unique school identifier',
  `helper` int DEFAULT NULL,
  `level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `active_section`
--
ALTER TABLE `active_section`
  ADD CONSTRAINT `active_section_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `active_section_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment`
--
ALTER TABLE `assignment`
  ADD CONSTRAINT `assignment_ibfk_1` FOREIGN KEY (`rubric_id`) REFERENCES `rubric` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `assignment_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignments_in_lesson`
--
ALTER TABLE `assignments_in_lesson`
  ADD CONSTRAINT `assignments_in_lesson_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lesson` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_in_lesson_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignments_in_section`
--
ALTER TABLE `assignments_in_section`
  ADD CONSTRAINT `assignments_in_section_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_in_section_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment_overall_grade_total`
--
ALTER TABLE `assignment_overall_grade_total`
  ADD CONSTRAINT `assignment_overall_grade_total_ibfk_1` FOREIGN KEY (`point_for_category`) REFERENCES `points_for_category` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_overall_grade_total_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_overall_grade_total_ibfk_3` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `category_for_rubric`
--
ALTER TABLE `category_for_rubric`
  ADD CONSTRAINT `category_for_rubric_ibfk_1` FOREIGN KEY (`rubric_id`) REFERENCES `rubric` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `category_for_rubric_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `category_for_teacher`
--
ALTER TABLE `category_for_teacher`
  ADD CONSTRAINT `category_for_teacher_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `category_for_teacher_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consent`
--
ALTER TABLE `consent`
  ADD CONSTRAINT `consent_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `course`
--
ALTER TABLE `course`
  ADD CONSTRAINT `course_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `emoji_reaction`
--
ALTER TABLE `emoji_reaction`
  ADD CONSTRAINT `fk_emoji_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_emoji_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_emoji_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `help`
--
ALTER TABLE `help`
  ADD CONSTRAINT `fk_help_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_help_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `mc_questions`
--
ALTER TABLE `mc_questions`
  ADD CONSTRAINT `mc_questions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peer_review`
--
ALTER TABLE `peer_review`
  ADD CONSTRAINT `peer_review_ibfk_1` FOREIGN KEY (`reviewer_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_review_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_review_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_review_ibfk_4` FOREIGN KEY (`reviewee_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_review_ibfk_5` FOREIGN KEY (`rubric_id`) REFERENCES `rubric` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `points_for_category`
--
ALTER TABLE `points_for_category`
  ADD CONSTRAINT `points_for_category_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `preferences_for_teacher`
--
ALTER TABLE `preferences_for_teacher`
  ADD CONSTRAINT `preferences_for_teacher_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`);

--
-- Constraints for table `role_for_user`
--
ALTER TABLE `role_for_user`
  ADD CONSTRAINT `role_for_user_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `role_for_user_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rubric`
--
ALTER TABLE `rubric`
  ADD CONSTRAINT `rubric_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `section`
--
ALTER TABLE `section`
  ADD CONSTRAINT `section_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `section_seat`
--
ALTER TABLE `section_seat`
  ADD CONSTRAINT `fk_section_seat_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_section_seat_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `section_seating_chart`
--
ALTER TABLE `section_seating_chart`
  ADD CONSTRAINT `fk_section_seating_chart_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students_in_section`
--
ALTER TABLE `students_in_section`
  ADD CONSTRAINT `students_in_section_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `students_in_section_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `submission`
--
ALTER TABLE `submission`
  ADD CONSTRAINT `submission_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submission_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `school` (`school_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
