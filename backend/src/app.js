// Express app setup: wires middleware, routes, static assets, and shared error handling.
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/isnap-runtime', express.static(path.resolve(__dirname, '../runtime/isnap')));
app.use(apiRoutes);

module.exports = app;
