// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

module.exports = mongoose.model('User', new Schema({
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },       // store hashed
  profilePic: { type: String },                       // Cloudinary URL
  bio:        { type: String },
  createdAt:  { type: Date,   default: Date.now },
  isVerified: { type: Boolean, default: false },
  meals:      [{ type: Schema.Types.ObjectId, ref: 'Meal' }],

  resetToken:       { type: String },
  resetTokenExpiry: { type: Date },
  verifyToken:      { type: String },
  verifyTokenExpiry:{ type: Date }
}));