//Import Routes
const sessionRoutes = require('./routes/sessions.js');
const teacherRoutes = require('./routes/teacherObservations.js');
const studentRoutes = require('./routes/studentObservations.js');

//Import config
const config = require('./config');

//Connect express and cors
const express = require('express');
const cors = require('cors');
const app = express();

//Middleware to parse JSON
app.use(express.json());
//Connection help
app.use(cors());

//Mount session routes under the '/sessions' url
app.use('/sessions', sessionRoutes);

//Mount teacher observation routes under the '/observations/teacher' url
app.use('/observations/teacher', teacherRoutes)

//Mount student observations routes under the '/observations/student' url
app.use('/observations/student', studentRoutes);

//Server Start-up
const PORT = config.server.port || 3010; //Use pre-determined port or just default to 3010
app.listen(PORT, () => {
    //Show that server is up and running
    console.log(`Server started and currently running on port ${PORT}`);
})