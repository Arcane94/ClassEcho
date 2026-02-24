/** Handles all logic related to User account creation, login, and management */

//Retrieve the User Model
const User = require(`../models/UserModel`);
const Session = require(`../models/SessionModel`);

// Import bycrypt for password hashing
const bcrypt = require('bcrypt');
// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

// Creates a new user account and returns the new user's id
// POST /user
exports.createUser = async (req, res) => { 
    try {
        // Save Body fields
        const { password, username } = req.body;

        // Ensure fields are all filled
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure username is unique
        const existingUser = await User.getByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash the password
        const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);

        // Save all fields to send to model
        const info = {
          username: username,
          hashed_password: hashed_password,
          //Set sessions to empty array for now
          sessions: [],
        };

        const user_id = await User.create(info);

        console.log('Retrieved user id: ', user_id);
        return res.status(201).json({ user_id });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error('Unexpected error creating user', error);
        return res.status(500).json({ error: 'Unexpected User Creation Error'});
    }
};


// Logic to handle user login and returns user information
// POST /user/login
exports.loginUser = async (req, res) => {
    try {
        console.log(" Attempting login with body:", req.body);
        // Save Body fields
        const { username, password } = req.body;
        // Ensure fields are all filled
        if (!username || !password) {
            return res.status(400).json({ error: 'Please enter both username and password.' });
        }

        //Retrieve user from database using username
        const user = await User.getByUsername(username);
        //If user not found, return error
        if (!user) {
            return res.status(404).json({ error: 'No user found with that username.' });
        }
        //Compare provided password with stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.hashed_password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid Password' });
        }
        //If login successful, return user information (excluding hashed password)
        return res.json({ user_id: user.user_id, username: user.username, sessions: user.sessions });
    } catch (error) {
        console.error('Unexpected error during user login', error);
        return res.status(500).json({ error: 'Unexpected User Login Error'});
    }   
};


// Logic to retrieve user information from database using id
// GET /user/:id
exports.getUserById = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;      
        //Logic to retrieve user from database using id
        const user = await User.getByUserId(id);
        console.log(user);
        //Return a 404 error if user cannot be found
        if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user_id: user.user_id, username: user.username, sessions: user.sessions });
    } catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Logic to update user's sessions array with new session id
// PUT /user/:id/sessions
exports.updateUserSessions = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;
        const { session_id } = req.body;
        //Ensure session_id is provided
        if (session_id === undefined || session_id === null) {
            return res.status(400).json({ error: 'Missing session_id in request body' });
        }
        //Retrieve user from database using id
        const user = await User.getByUserId(id);
        //If user not found, return error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        //Parse the user's sessions array, add the new session id, and update in database
        let sessions = [];
        if (Array.isArray(user.sessions)) {
            sessions = user.sessions;
        } else if (typeof user.sessions === 'string') {
            try {
                const parsedSessions = JSON.parse(user.sessions);
                sessions = Array.isArray(parsedSessions) ? parsedSessions : [];
            } catch (_parseError) {
                sessions = [];
            }
        } else if (user.sessions && typeof user.sessions === 'object') {
            sessions = Array.isArray(user.sessions) ? user.sessions : [];
        }

        const normalizedSessionId = Number(session_id);
        const sessionIdToStore = Number.isNaN(normalizedSessionId) ? session_id : normalizedSessionId;

        if (!sessions.map(savedSessionId => String(savedSessionId)).includes(String(sessionIdToStore))) {
            sessions.push(sessionIdToStore);
            const rowsUpdated = await User.updateByUserId(id, { sessions });
            if (rowsUpdated != 1) {
                return res.status(500).json({ error: 'Failed to update user sessions' });
            }
        }

        return res.json({ message: 'User sessions updated successfully' });
    } catch (err) {
        console.error('Error updating user sessions:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

//Logic to retrieve all of the session information from the user's sessions array
//GET /user/:id/sessions
exports.getUserSessions = async (req, res) => {
    try {        
        const { id } = req.params;
        //Retrieve user from database using id
        const user = await User.getByUserId(id);
        //If user not found, return error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let sessions = [];
        //Parse the sessions as array
        if (Array.isArray(user.sessions)) {
            sessions = user.sessions;
        } else if (typeof user.sessions === 'string') {
            try {
                const parsedSessions = JSON.parse(user.sessions);
                sessions = Array.isArray(parsedSessions) ? parsedSessions : [];
            } catch (_parseError) {
                sessions = [];
            }
        } else if (user.sessions && typeof user.sessions === 'object') {
            sessions = Array.isArray(user.sessions) ? user.sessions : [];
        }
        //Use sessions array to retrieve session information for each session and return as array
        const sessionInfo = [];
        for (const sessionId of sessions) {
            const session = await Session.getById(sessionId);
            if (session) {
                // Map session_name to lesson_name to match frontend SessionData interface
                sessionInfo.push({
                    ...session,
                    lesson_name: session.session_name
                });
            }
        }

        //return all retrieved session information
        return res.json({ sessions: sessionInfo });
    } catch(error) {
        console.error('Error retrieving user sessions:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

//Logic to retrieve all of the session information from the user's edit_sessions array
//GET /user/:id/edit_sessions
exports.getUserEditSessions = async (req, res) => {
    try {        
        const { id } = req.params;
        //Retrieve user from database using id
        const user = await User.getByUserId(id);
        //If user not found, return error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let edit_sessions = [];
        //Parse the edit_sessions as array
        if (Array.isArray(user.edit_sessions)) {
            edit_sessions = user.edit_sessions;
        } else if (typeof user.edit_sessions === 'string') {
            try {
                const parsedEditSessions = JSON.parse(user.edit_sessions);
                edit_sessions = Array.isArray(parsedEditSessions) ? parsedEditSessions : [];
            } catch (_parseError) {
                edit_sessions = [];
            }
        } else if (user.edit_sessions && typeof user.edit_sessions === 'object') {
            edit_sessions = Array.isArray(user.edit_sessions) ? user.edit_sessions : [];
        }
        //Use edit_sessions array to retrieve session information for each session and return as array
        const sessionInfo = [];
        for (const sessionId of edit_sessions) {
            const session = await Session.getById(sessionId);
            if (session) {
                // Map session_name to lesson_name to match frontend SessionData interface
                sessionInfo.push({
                    ...session,
                    lesson_name: session.session_name
                });
            }
        }

        //return all retrieved session information
        return res.json({ sessions: sessionInfo });
    } catch(error) {
        console.error('Error retrieving user edit sessions:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

//Logic to retrieve just a user id using the username, used for password reset functionality
//GET /user/id/:username
exports.getUserIdByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.getByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user_id: user.user_id });
    } catch (error) {
        console.error('Error retrieving user id by username:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

//Logic to update a users password using the user id and new password
//PUT /user/:id/password
exports.updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        if (!new_password) {
            return res.status(400).json({ error: 'Missing new_password in request body' });
        }
        const user = await User.getByUserId(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const hashed_password = await bcrypt.hash(new_password, SALT_ROUNDS);
        const rowsUpdated = await User.updateByUserId(id, { hashed_password });
        if (rowsUpdated != 1) {
            return res.status(500).json({ error: 'Failed to update user password' });
        }
        return res.json({ message: 'User password updated successfully' });
    } catch (error) {
        console.error('Error updating user password:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};