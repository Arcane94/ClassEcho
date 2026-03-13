-- Creates the observer tool schema
CREATE DATABASE IF NOT EXISTS observer;
USE observer;

-- =========================
-- OBSERVER USER TABLE
-- =========================
CREATE TABLE observer_user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- List of the ids of all sessions that this user has accessed
    sessions JSON,
    -- List of the ids of all sessions that this user has edit access to
    edit_sessions JSON
);

-- =========================
-- SESSION TABLE
-- =========================
CREATE TABLE session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    server_time DATETIME NOT NULL,
    local_time DATETIME,
    observer_name VARCHAR(100),
    teacher_name VARCHAR(100),
    session_name VARCHAR(200),
    lesson_description TEXT,
    -- List of the user ids of all observers that have accessed this section
    observers JSON,
    -- List of the user ids of observers that have edit access to this session
    editors JSON,
    -- Unique join code for observers to join this session
    join_code VARCHAR(50) NOT NULL UNIQUE
);

-- =========================
-- SECTION TABLE
-- =========================
CREATE TABLE session_section (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    -- Segtor (Only "Student" and "Teacher" currently)
    session_segtor VARCHAR(50) NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    -- Create foreign key relationship to session table that allows sections to only be created if the tables
    -- session id matches an existing session, also cascades down to section upon session deletion
    CONSTRAINT fk_session 
        FOREIGN KEY (session_id) 
        REFERENCES session(session_id) 
        ON DELETE CASCADE,
    INDEX idx_session_id (session_id)
);

-- Tags table
CREATE TABLE section_tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    tag_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_section 
        FOREIGN KEY (section_id) 
        REFERENCES session_section(section_id) 
        ON DELETE CASCADE,
    INDEX idx_section_id (section_id)
);

-- =========================
-- TEACHER OBSERVATION TABLE
-- =========================
CREATE TABLE teacher_observation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id VARCHAR(100),
    teacher_position VARCHAR(100),
    start_time DATETIME,
    selected_tags JSON,
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
    selected_tags JSON,
    affect JSON,
	submitted_by_user BOOLEAN DEFAULT FALSE,
	recording BOOLEAN DEFAULT NULL,
    note TEXT,
    on_task BOOLEAN,
    picture_attachments BLOB,
    CONSTRAINT fk_student_session FOREIGN KEY (session_id) REFERENCES session(session_id)
);
