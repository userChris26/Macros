const mongoose = require('mongoose');

const networkSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can't follow the same person twice
networkSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model('Network', networkSchema); 