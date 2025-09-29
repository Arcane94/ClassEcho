// Connecting to MySQL database using connection information stored in backend/config.js
const mysql = require('mysql2');

//Connection
const connection = mysql.createConnection({
  host: this.config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.db
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Successfully Connected to Database');
});

module.exports = connection;