// Backend server bootstrap: loads config and starts listening on the configured port.
const app = require('./app');
const config = require('./config/appConfig');

//Server Start-up
const PORT = config.server.port || 3010; //Use pre-determined port or just default to 3010
app.listen(PORT, () => {
    //Show that server is up and running
    console.log(`Server started and currently running on port ${PORT}`);
})
