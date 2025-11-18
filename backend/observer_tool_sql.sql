-- Creates the observer tool schema
CREATE DATABASE IF NOT EXISTS observer;
USE observer;

-- =========================
-- SESSION TABLE
-- =========================
CREATE TABLE session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    server_time DATETIME NOT NULL,
    local_time DATETIME,
    observer_name VARCHAR(100),
    teacher_name VARCHAR(100),
    lesson_name VARCHAR(200),
    lesson_description TEXT
);

-- =========================
-- TEACHER OBSERVATION TABLE
-- =========================
CREATE TABLE teacher_observation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id VARCHAR(100),
    start_time DATETIME,
    behavior_tags JSON,
    function_tags JSON,
    structure_tags JSON,
    custom_tags JSON,
    submitted_by_user BOOLEAN DEFAULT FALSE,
	recording BOOLEAN DEFAULT NULL,
    note TEXT,
    picture_attachments BLOB,
    CONSTRAINT fk_teacher_session FOREIGN KEY (session_id) REFERENCES session(session_id)
);

-- =========================
-- STUDENT OBSERVATION TABLE
-- =========================
CREATE TABLE student_observation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id VARCHAR(100),
    start_time DATETIME,
    behavior_tags JSON,
    affect JSON,
    custom_tags JSON,
	submitted_by_user BOOLEAN DEFAULT FALSE,
	recording BOOLEAN DEFAULT NULL,
    note TEXT,
    on_task BOOLEAN,
    picture_attachments BLOB,
    CONSTRAINT fk_student_session FOREIGN KEY (session_id) REFERENCES session(session_id)
);
