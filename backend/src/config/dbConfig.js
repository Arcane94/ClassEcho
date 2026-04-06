// Import knex for database managament and model creation
const knex = require('knex');
const config = require('./appConfig');

//Connect to database using credentials defined in config.js
const db = knex({
  client: 'mysql2',
  connection: {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.db
  },
  pool: { min: 0, max: 10 } //Look into what this means
});

module.exports = db;
