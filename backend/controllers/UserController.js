/** Handles all logic related to User account creation, login, and management */

//Retrieve the User Model
const User = require(`../models/UserModel`);

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