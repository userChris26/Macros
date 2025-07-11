// api.js - Social Network Endpoints
// ============================================

const express = require('express');
const mongoose = require('mongoose');

// Import Cloudinary configuration
const { cloudinary, upload } = require('./config/cloudinary');

// Define schemas for social network features
const UserSchema = new mongoose.Schema({
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  profilePic: { type: String },
  bio:        { type: String },
  createdAt:  { type: Date,   default: Date.now }
});

const NetworkSchema = new mongoose.Schema({
  followerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt:   { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Network = mongoose.model('Network', NetworkSchema);

// ─── Social Network Endpoints

// Follow a user
app.post('/api/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    
    // Check if already following
    const existing = await Network.findOne({ followerId, followingId });
    if (existing) {
      return res.json({ error: 'Already following this user' });
    }
    
    // Check if trying to follow self
    if (followerId === followingId) {
      return res.json({ error: 'Cannot follow yourself' });
    }
    
    await Network.create({ followerId, followingId });
    res.json({ error: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not follow user' });
  }
});

// Unfollow a user
app.delete('/api/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    await Network.findOneAndDelete({ followerId, followingId });
    res.json({ error: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not unfollow user' });
  }
});

// Get followers for a user
app.get('/api/followers/:userId', async (req, res) => {
  try {
    const followers = await Network.find({ followingId: req.params.userId })
                                   .populate('followerId', 'firstName lastName email profilePic')
                                   .sort({ createdAt: -1 });
    res.json({ followers, error: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch followers' });
  }
});

// Get users being followed by a user
app.get('/api/following/:userId', async (req, res) => {
  try {
    const following = await Network.find({ followerId: req.params.userId })
                                   .populate('followingId', 'firstName lastName email profilePic')
                                   .sort({ createdAt: -1 });
    res.json({ following, error: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch following' });
  }
});

// ─── Profile Management Endpoints

// Upload profile picture
app.post('/api/upload-profile-pic/:userId', upload.single('profilePic'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Update user's profile picture URL in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: req.file.path },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicUrl: req.file.path,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic
      },
      error: ''
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Delete profile picture
app.delete('/api/delete-profile-pic/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete from Cloudinary if exists
    if (user.profilePic) {
      const publicId = user.profilePic.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: null },
      { new: true }
    );

    res.json({
      message: 'Profile picture deleted successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic
      },
      error: ''
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

// Get user profile (including profile picture)
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        createdAt: user.createdAt
      },
      error: ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch user profile' });
  }
});

// Update user profile
app.put('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, bio },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        bio: updatedUser.bio
      },
      error: ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// ─── Export function to set up routes
function setApp(appInstance, mongooseInstance) {
  // Set up the app and mongoose instances
  app = appInstance;
  mongoose = mongooseInstance;
  
  console.log('✅ Social network API endpoints loaded');
}

module.exports = {
  setApp
}; 
