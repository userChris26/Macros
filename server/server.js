const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
const mongoose = require("mongoose");
mongoose.connect(uri)
  .then(() => console.log("Mongo DB connected"))
  .catch(err => console.log(err));

const app = express();

// Increase payload size limit for JSON and URL-encoded bodies
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());

app.use((req, res, next) =>
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

var api = require('./api.js');
api.setApp( app, mongoose );

app.listen(5000); // start Node + Express server on port 5000