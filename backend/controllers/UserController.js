/** Handles all logic related to User account creation, login, and management */

//Retrieve the User Model
const User = require(`../models/UserModel`);
const Session = require(`../models/SessionModel`);
const config = require('../config');

// Import bycrypt for password hashing
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;
const PASSWORD_RESET_CODE_TTL_MS = 10 * 60 * 1000;
const passwordResetCodes = new Map();

function getEmailConfig() {
    return {
        service: process.env.EMAIL_SERVICE || config.email?.service || 'gmail',
        host: process.env.SMTP_HOST || config.email?.host,
        port: Number(process.env.SMTP_PORT || config.email?.port || 587),
        secure: String(process.env.SMTP_SECURE || config.email?.secure || 'false') === 'true',
        user: process.env.EMAIL_USER || config.email?.user,
        pass: process.env.EMAIL_APP_PASSWORD || config.email?.appPassword,
        from: process.env.EMAIL_FROM || config.email?.from || process.env.EMAIL_USER || config.email?.user,
    };
}

function createEmailTransporter() {
    const emailConfig = getEmailConfig();
    if (!emailConfig.user || !emailConfig.pass) {
        throw new Error('Email credentials are missing. Set EMAIL_USER and EMAIL_APP_PASSWORD.');
    }

    if (emailConfig.host) {
        return nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });
    }

    return nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
        },
    });
}

function hashResetCode(resetCode) {
    return crypto.createHash('sha256').update(String(resetCode)).digest('hex');
}

function generateResetCode() {
    return String(crypto.randomInt(100000, 1000000));
}

async function findUserByIdentifier(identifier) {
    const normalizedIdentifier = String(identifier || '').trim();
    if (!normalizedIdentifier) {
        return null;
    }
    let user = await User.getByUsername(normalizedIdentifier);
    if (!user) {
        user = await User.getByEmail(normalizedIdentifier);
    }
    return user;
}

function validateStoredResetCode(userId, resetCode, consumeCode = false) {
    const key = String(userId);
    const stored = passwordResetCodes.get(key);
    if (!stored) {
        return { valid: false, error: 'Reset code not found. Please request a new code.' };
    }

    if (Date.now() > stored.expiresAt) {
        passwordResetCodes.delete(key);
        return { valid: false, error: 'Reset code expired. Please request a new code.' };
    }

    if (stored.codeHash !== hashResetCode(resetCode)) {
        return { valid: false, error: 'Invalid reset code.' };
    }

    if (consumeCode) {
        passwordResetCodes.delete(key);
    }

    return { valid: true };
}

// Creates a new user account and returns the new user's id
// POST /user
exports.createUser = async (req, res) => { 
    try {
        // Save Body fields
        const { password, username, email } = req.body;

        // Ensure fields are all filled
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure username is unique
        const existingUser = await User.getByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Ensure email is unique
        const existingEmail = await User.getByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Hash the password
        const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);

        // Save all fields to send to model
        const info = {
          username: username,
          hashed_password: hashed_password,
          //Set sessions to empty array for now
          sessions: [],
          email: email
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
        const { username, password, email } = req.body;
        // Ensure fields are all filled
        if ((!username && !email) || !password) {
            return res.status(400).json({ error: 'Please enter all required fields.' });
        }

        // Retrieve user from database using whichever identifier is provided
        let user = null;

        if (username && username.trim()) {
            const normalizedUsername = username.trim();
            user = await User.getByUsername(normalizedUsername);

            // If username field contains an email, or username lookup fails, try email as fallback
            if (!user) {
                user = await User.getByEmail(normalizedUsername);
            }
        } else if (email && email.trim()) {
            const normalizedEmail = email.trim();
            user = await User.getByEmail(normalizedEmail);

            // Fallback in case a username is sent in the email field
            if (!user) {
                user = await User.getByUsername(normalizedEmail);
            }
        }

        //If user not found, return error
        if (!user) {
            return res.status(404).json({ error: 'No user found with that username or email.' });
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

// Logic to update user's edit_sessions array with new session id
// PUT /user/:id/sessions/edit
exports.updateUserEditSessions = async (req, res) => {
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
        //Parse the user's edit_sessions array, add the new session id, and update in database
        let edit_sessions = [];
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

        const normalizedSessionId = Number(session_id);
        const sessionIdToStore = Number.isNaN(normalizedSessionId) ? session_id : normalizedSessionId;

        if (!edit_sessions.map(savedSessionId => String(savedSessionId)).includes(String(sessionIdToStore))) {
            edit_sessions.push(sessionIdToStore);
            const rowsUpdated = await User.updateByUserId(id, { edit_sessions });
            if (rowsUpdated != 1) {
                return res.status(500).json({ error: 'Failed to update user edit sessions' });
            }
        }

        return res.json({ message: 'User edit sessions updated successfully' });
    } catch (err) {
        console.error('Error updating user edit sessions:', err);
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

//Logic to retrieve just a user id using a username or email, used for password reset functionality
//GET /user/username/:username
exports.getUserIdByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const normalizedIdentifier = (username || '').trim();
        let user = await User.getByUsername(normalizedIdentifier);
        if (!user) {
            user = await User.getByEmail(normalizedIdentifier);
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user_id: user.user_id });
    } catch (error) {
        console.error('Error retrieving user id by username/email:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Request a one-time password reset code over email
// POST /user/password-reset/request
exports.requestPasswordResetCode = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier || !String(identifier).trim()) {
            return res.status(400).json({ error: 'Missing identifier in request body' });
        }

        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.email) {
            return res.status(400).json({ error: 'No email is associated with this account.' });
        }

        const resetCode = generateResetCode();
        passwordResetCodes.set(String(user.user_id), {
            codeHash: hashResetCode(resetCode),
            expiresAt: Date.now() + PASSWORD_RESET_CODE_TTL_MS,
        });

        const transporter = createEmailTransporter();
        const emailConfig = getEmailConfig();

        await transporter.sendMail({
            from: emailConfig.from,
            to: user.email,
            subject: 'ClassEcho password reset code',
            text: `Your ClassEcho password reset code is: ${resetCode}. This code expires in 10 minutes.`,
            html: `<p>Your ClassEcho password reset code is:</p><p style="font-size: 24px; font-weight: bold;">${resetCode}</p><p>This code expires in 10 minutes.</p>`,
        });

        return res.json({ message: 'Reset code sent to your email' });
    } catch (error) {
        console.error('Error requesting password reset code:', error);
        return res.status(500).json({ error: 'Failed to send reset code' });
    }
};

// Verify a one-time password reset code
// POST /user/password-reset/verify
exports.verifyPasswordResetCode = async (req, res) => {
    try {
        const { identifier, reset_code } = req.body;
        if (!identifier || !String(identifier).trim() || !reset_code) {
            return res.status(400).json({ error: 'Missing identifier or reset_code in request body' });
        }

        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validation = validateStoredResetCode(user.user_id, reset_code, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        return res.json({ message: 'Reset code is valid' });
    } catch (error) {
        console.error('Error verifying password reset code:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Confirm reset code and update password
// PUT /user/password-reset/confirm
exports.confirmPasswordReset = async (req, res) => {
    try {
        const { identifier, reset_code, new_password } = req.body;
        if (!identifier || !String(identifier).trim() || !reset_code || !new_password) {
            return res.status(400).json({ error: 'Missing required fields in request body' });
        }

        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validation = validateStoredResetCode(user.user_id, reset_code, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const hashed_password = await bcrypt.hash(new_password, SALT_ROUNDS);
        const rowsUpdated = await User.updateByUserId(user.user_id, { hashed_password });
        if (rowsUpdated != 1) {
            return res.status(500).json({ error: 'Failed to update user password' });
        }

        return res.json({ message: 'User password updated successfully' });
    } catch (error) {
        console.error('Error confirming password reset:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

//Logic to update a users password using the user id and new password
//PUT /user/:id/password
exports.updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password, reset_code } = req.body;
        if (!new_password || !reset_code) {
            return res.status(400).json({ error: 'Missing new_password or reset_code in request body' });
        }
        const user = await User.getByUserId(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validation = validateStoredResetCode(id, reset_code, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
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