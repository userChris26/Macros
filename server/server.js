const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const uri = process.env.MONGODB_URI;
const mongoose = require("mongoose");
mongoose.connect(uri)
  .then(() => console.log("Mongo DB connected"))
  .catch(err => console.log(err));

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(cookieParser()); // Add cookie parser

// Remove the old CORS configuration since we're using the cors middleware

var api = require('./api.js');
api.setApp(app, mongoose);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});