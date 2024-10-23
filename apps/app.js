const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const routes = require('./routes/app-route');
app.use(bodyParser.json({
    limit: '5mb'
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
routes(app);
module.exports = app;
