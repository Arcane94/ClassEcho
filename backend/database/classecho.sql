-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 09, 2026 at 08:08 PM
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
-- Database: `observer_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `observer_user`
--

DROP TABLE IF EXISTS `observer_user`;
CREATE TABLE IF NOT EXISTS `observer_user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `sessions` json DEFAULT NULL,
  `edit_sessions` json DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `period_seats`
--

DROP TABLE IF EXISTS `period_seats`;
CREATE TABLE IF NOT EXISTS `period_seats` (
  `period_seat_id` int NOT NULL AUTO_INCREMENT,
  `session_period_id` int NOT NULL,
  `seat_label` varchar(50) DEFAULT NULL,
  `x` int NOT NULL,
  `y` int NOT NULL,
  `seat_type` enum('student','teacher','empty','blocked') NOT NULL DEFAULT 'student',
  PRIMARY KEY (`period_seat_id`),
  UNIQUE KEY `session_period_id` (`session_period_id`,`x`,`y`),
  UNIQUE KEY `session_period_id_2` (`session_period_id`,`seat_label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `period_seat_assignments`
--

DROP TABLE IF EXISTS `period_seat_assignments`;
CREATE TABLE IF NOT EXISTS `period_seat_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `session_period_id` int NOT NULL,
  `period_seat_id` int NOT NULL,
  `student_identifier` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `period_seat_id` (`period_seat_id`),
  UNIQUE KEY `session_period_id` (`session_period_id`,`student_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `section_tag`
--

DROP TABLE IF EXISTS `section_tag`;
CREATE TABLE IF NOT EXISTS `section_tag` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `tag_name` varchar(255) NOT NULL,
  PRIMARY KEY (`tag_id`),
  KEY `idx_section_id` (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
CREATE TABLE IF NOT EXISTS `session` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `server_time` datetime NOT NULL,
  `local_time` datetime DEFAULT NULL,
  `teacher_name` varchar(100) DEFAULT NULL,
  `session_name` varchar(200) DEFAULT NULL,
  `lesson_description` text,
  `creator` int NOT NULL,
  `observers` json DEFAULT NULL,
  `editors` json DEFAULT NULL,
  `join_code` varchar(50) NOT NULL,
  `student_id_numeric_only` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `join_code` (`join_code`),
  KEY `idx_creator` (`creator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_dates`
--

DROP TABLE IF EXISTS `session_dates`;
CREATE TABLE IF NOT EXISTS `session_dates` (
  `session_date_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `observation_date` date NOT NULL,
  PRIMARY KEY (`session_date_id`),
  UNIQUE KEY `session_id` (`session_id`,`observation_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_periods`
--

DROP TABLE IF EXISTS `session_periods`;
CREATE TABLE IF NOT EXISTS `session_periods` (
  `session_period_id` int NOT NULL AUTO_INCREMENT,
  `session_date_id` int NOT NULL,
  `period_label` varchar(50) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `student_id_prefix` varchar(50) DEFAULT NULL,
  `time_zone` varchar(64) NOT NULL DEFAULT 'America/New_York',
  PRIMARY KEY (`session_period_id`),
  UNIQUE KEY `session_date_id` (`session_date_id`,`period_label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_section`
--

DROP TABLE IF EXISTS `session_section`;
CREATE TABLE IF NOT EXISTS `session_section` (
  `section_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `session_sector` varchar(50) DEFAULT NULL,
  `section_name` varchar(255) NOT NULL,
  PRIMARY KEY (`section_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_user_access`
--

DROP TABLE IF EXISTS `session_user_access`;
CREATE TABLE IF NOT EXISTS `session_user_access` (
  `session_user_access_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('viewer','full_editor','viz_editor') NOT NULL DEFAULT 'viewer',
  `granted_by` int DEFAULT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_user_access_id`),
  UNIQUE KEY `uq_session_user` (`session_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_granted_by` (`granted_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_observation`
--

DROP TABLE IF EXISTS `student_observation`;
CREATE TABLE IF NOT EXISTS `student_observation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `observer_id` int NOT NULL,
  `student_id` varchar(100) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `selected_tags` json DEFAULT NULL,
  `affect` json DEFAULT NULL,
  `recording` tinyint(1) NOT NULL,
  `note` text,
  `on_task` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_observation_observer` (`observer_id`),
  KEY `fk_student_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_observation`
--

DROP TABLE IF EXISTS `teacher_observation`;
CREATE TABLE IF NOT EXISTS `teacher_observation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `observer_id` int NOT NULL,
  `student_id` varchar(100) DEFAULT NULL,
  `teacher_position` varchar(100) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `selected_tags` json DEFAULT NULL,
  `recording` tinyint(1) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `fk_teacher_observation_observer` (`observer_id`),
  KEY `fk_teacher_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `period_seats`
--
ALTER TABLE `period_seats`
  ADD CONSTRAINT `period_seats_ibfk_1` FOREIGN KEY (`session_period_id`) REFERENCES `session_periods` (`session_period_id`) ON DELETE CASCADE;

--
-- Constraints for table `period_seat_assignments`
--
ALTER TABLE `period_seat_assignments`
  ADD CONSTRAINT `period_seat_assignments_ibfk_1` FOREIGN KEY (`session_period_id`) REFERENCES `session_periods` (`session_period_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `period_seat_assignments_ibfk_2` FOREIGN KEY (`period_seat_id`) REFERENCES `period_seats` (`period_seat_id`) ON DELETE CASCADE;

--
-- Constraints for table `section_tag`
--
ALTER TABLE `section_tag`
  ADD CONSTRAINT `fk_section` FOREIGN KEY (`section_id`) REFERENCES `session_section` (`section_id`) ON DELETE CASCADE;

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `fk_session_creator` FOREIGN KEY (`creator`) REFERENCES `observer_user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `session_dates`
--
ALTER TABLE `session_dates`
  ADD CONSTRAINT `session_dates_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_periods`
--
ALTER TABLE `session_periods`
  ADD CONSTRAINT `session_periods_ibfk_1` FOREIGN KEY (`session_date_id`) REFERENCES `session_dates` (`session_date_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_section`
--
ALTER TABLE `session_section`
  ADD CONSTRAINT `fk_session` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_user_access`
--
ALTER TABLE `session_user_access`
  ADD CONSTRAINT `fk_sua_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `observer_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sua_session` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sua_user` FOREIGN KEY (`user_id`) REFERENCES `observer_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_observation`
--
ALTER TABLE `student_observation`
  ADD CONSTRAINT `fk_student_observation_observer` FOREIGN KEY (`observer_id`) REFERENCES `observer_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_student_session` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_observation`
--
ALTER TABLE `teacher_observation`
  ADD CONSTRAINT `fk_teacher_observation_observer` FOREIGN KEY (`observer_id`) REFERENCES `observer_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teacher_session` FOREIGN KEY (`session_id`) REFERENCES `session` (`session_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
