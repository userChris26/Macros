// models/User.js
const { Schema } = require('mongoose');
const ufnConn = require('../db');

module.exports = ufnConn.model('User', new Schema({
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },       // store hashed
  profilePic: { type: String },                       // Cloudinary URL
  bio:        { type: String },
  createdAt:  { type: Date,   default: Date.now },
  meals:      [{ type: Schema.Types.ObjectId, ref: 'Meal' }]
}));