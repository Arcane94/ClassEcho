//Import config
const config = require('./config');

//Connect express
const express = require('express');
const app = express();

//Middleware to parse JSON
app.use(express.json());

//Server Start-up
const PORT = config.server.port || 3010; //Use pre-determined port or just default to 3010
app.listen(PORT, () => {
    //Show that server is up and running
    console.log(`Server started and currently running on port ${PORT}`);
})