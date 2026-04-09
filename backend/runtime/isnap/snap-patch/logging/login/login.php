<?php

include('../config.php');

if (!array_key_exists('id', $_POST)) {
    echo '{"error": "No ID provided."}';
    exit;
}

// The goal of the following code is to CONFIRM if the user is new or returning.
// This code does not follow the traditional user login. 
// Once user is confirmed as either one, return their userId.
// If they cannot be confirmed, return that they are a new user.

// Get the user's id and lower case it
$id = strtolower($_POST['id']);
// Hash the user ID using SHA-256
$hashed_id = hash('sha256', $id);

// Check if the user is new
$new = array_key_exists('new', $_POST) && $_POST['new'] === 'true';

// Confirm if the user is not new
if (!$new) {
    // User is not new. 
    //However, let's confirm this by checking if there is a log about them in the database

    // Connect to the database
    $mysqli = new mysqli($host, $user, $password, $db);
    if ($mysqli->connect_errno) {
        http_response_code(503);
        echo '{"error": "Service unavailable"}';
        exit;
    }

    // Prepare the query to find the user
    $stmt = $mysqli->prepare("SELECT 1 FROM $table WHERE userID = ? LIMIT 1");
    if (!$stmt) {
        http_response_code(500);
        echo '{"error": "Failed to prepare the SQL query"}';
        exit;
    }

    // Bind the parameter and execute
    $stmt->bind_param("s", $hashed_id);
    $stmt->execute();
    $result = $stmt->get_result();

    // Close the prepared statement
    $stmt->close();
    $mysqli->close();

    // If there are 0 logs about this user, then they are actually a new user which was not confirmed before hand
    if ($result->num_rows === 0) {
        // Return response stating that this user is actually new.
        // This will prompt the user to confirm if they are a new user on the frontend.
        // If yes, the entire process of login.php starts over, but now knows that
        // the user is new at the very start this time.
        echo '{"newUser": true}';
        exit;
    }
}

// Default response for returning users and new users.
// If this point is reached, it is CONFIRMED that this user is either returning or new.
echo '{"userID": "' . $hashed_id . '"}';
?>