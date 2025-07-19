const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('./app.js');

require('dotenv').config();

// Initialize SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ Missing SENDGRID_API_KEY in .env');
} else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid API key loaded');
}

if (!process.env.SENDGRID_SENDER_EMAIL) {
    console.error('❌ Missing SENDGRID_SENDER_EMAIL in .env');
} else {
    console.log('✅ SendGrid sender email configured:', process.env.SENDGRID_SENDER_EMAIL);
}

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
const mongoose = require("mongoose");
mongoose.connect(uri)
  .then(() => console.log("Mongo DB connected"))
  .catch(err => console.log(err));

const server = express();

// Increase payload size limit for JSON and URL-encoded bodies
server.use(bodyParser.json({limit: '50mb'}));
server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
server.use(cors());

server.use((req, res, next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

// var api = require('./api.js');
// api.setApp( server, mongoose );
server.use("", app);

server.listen(5000); // start Node + Express server on port 5000