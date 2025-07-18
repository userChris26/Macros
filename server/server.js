require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const api = require('./api.js');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
} else {
  console.log('✅ Found MONGODB_URI');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Set up API routes
api.setApp(app);

// HTTP Server (redirect to HTTPS)
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
});

// SSL certificate paths
const sslOptions = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem')
};

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Start servers
const HTTP_PORT = 5000;
const HTTPS_PORT = 5443;

httpApp.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT} (redirecting to HTTPS)`);
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running on port ${HTTPS_PORT}`);
});