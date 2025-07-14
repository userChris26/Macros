// api.js - Social Network Endpoints
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const { cloudinary, upload } = require('./config/cloudinary');
const sgMail = require('@sendgrid/mail');

//Define schemas for social network features
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
const Food = mongoose.model('Food', UserSchema);
const Meal = mongoose.model('Meal', UserSchema);

exports.setApp = function( app, client )
{
	// ─── Account Endpoints
	app.post('/api/register', async (req, res) =>
	{
		// incoming: email, password, firstName, lastName
		// outgoing: error

		const { userEmail, userPassword, userFirstName, userLastName } = req.body;
		var ret;
		
		const result = await User.findOne({ email: userEmail });
		try
		{
			if (result)
			{
				ret = { error: "Account Already Exists" };
			}
			else
			{
				const newUser = new User(
				{ 
				email: userEmail,
				password: userPassword,
				firstName: userFirstName, lastName: userLastName
				});
				await newUser.save();

				ret = { error: '' };

				// const msg = {
				// to: email,
				// from: 'noreply@email.com',
				// subject: 'Macro - Verify your email',
				// text: `Copy and paste the address below to verify your account. 
				// 	http://${req.headers.host}/verify-email?token=${user.emailToken}`,
				// html: `<h1>Hello</h1>
				// 	<p>Thank you for registering on our site.</p>
				// 	<p>Please click the link below to verify your account.</p>
				// 	<a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">Verify your account</a>`
				// };
				
				// await sgMain.send(msg);
			}
		}
		catch(e)
		{
			console.error(e);
			ret = { error: e.message };
		}

		res.status(200).json(ret);
	});

	app.post('/api/login', async (req, res) =>
		{
			// incoming: email, password
			// outgoing: id, firstName, lastName, error

			const { userEmail, userPassword } = req.body;
			var ret;
					
			const result = await User.findOne({ userEmail, userPassword });
			try
			{
				if (!result)
				{
					ret = { error: "Login/Password incorrect" };
				}
				else
				{
					const token = require("./createJWT.js");

					ret = token.createToken(
					{
						id: result._id,
						firstName: result.firstName,
						lastName: result.lastName,
						profilePic: result.profilePic,
						bio: result.bio
					});
				}
			}
			catch(e)
			{
			ret = { error: e.message };
			}
			
			res.status(200).json(ret);
		});

	app.post('/api/updateaccount', async (req, res) =>
		{
			// incoming: userId, userFirstName, userLastName, userEmail, userJwt
			// outgoing: error

			var token = require('./createJWT.js');
			
			const { userId, userFirstName, userLastName, userEmail, userJwt } = req.body;
			
			try
			{
				if(token.isExpired(userJwt))
				{
					var ret = {error: 'The JWT is no longer valid', userJwt: ''};
					res.status(200).json(ret);
					return;
				}
			}
			catch(e)
			{
				console.log(e.message);
			}
			
			var error = '';

			try
			{
				result = await User.updateOne(
					{_id:ObjectId.createFromHexString(userId)},
					{
						$set: { email: userEmail, firstName: userFirstName, lastName: userLastName }
					}
				);
				
			}
			catch(e)
			{
				error = e.toString();
			}

			var refreshedToken = null;
			try
			{
				refreshedToken = token.refresh(userJwt);
			}
			catch(e)
			{
				console.log(e.message);
			}

			var ret = { error: error, userJwt: refreshedToken };
			res.status(200).json(ret);
		});

	// ─── Social Network Endpoints

	// Follow a user
	app.post('/api/follow', async (req, res) => {
		var token = require('./createJWT.js');
		var ret;
		var error = '';

		const { followerId, followingId, userJwt } = req.body;
		try {
			try {
				if (token.isExpired(userJwt)) {
					ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
					return;
				}
			}
			catch(e) {
				error = e.toString();
			}
			
			const existing = await Network.findOne({ followerId, followingId });
			if (existing) {
				error = 'Already following this user';
			}
			else if (followerId === followingId) {
				error = 'Cannot follow yourself';
				return res.json(ret);
			}
			else {
				await Network.create({ followerId, followingId });
				error = '';
			}

			var refreshedToken = null;
			try {
				refreshedToken = token.refresh(userJwt);
			}
			catch(e) {
				error = e.toString();
			}

			ret = { error: error, userJwt: refreshedToken };
		} catch (err) {
			console.error(err);
			// res.status(500).json({ error: 'Could not follow user' });
		}

		res.status(200).json(ret);
	});

	// Unfollow a user
	app.delete('/api/follow', async (req, res) => {
		var token = require('./createJWT.js');
		var ret;
		var error = '';

		try {
			const { followerId, followingId, userJwt } = req.body;

			try {
				if (token.isExpired(userJwt)) {
					ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
					return;
				}
			}
			catch(e) {
				console.log(e.message);
			}

			await Network.findOneAndDelete({ followerId, followingId });

			var refreshedToken = null;
			try
			{
				refreshedToken = token.refresh(userJwt);
			}
			catch(e)
			{
				console.log(e.message);
			}

			ret = { error: error, userJwt: refreshedToken };
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Could not unfollow user' });
		}

		res.status(200).json(ret);
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
		var token = require('./createJWT.js');

		try {
			const { userId } = req.params;
			const { firstName, lastName, bio, userJwt } = req.body;
	
			try
			{
				if (token.isExpired(userJwt))
				{
					ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
					return;
				}
			}
			catch(e)
			{
				console.log(e.message);
			}

			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ firstName, lastName, bio },
				{ new: true }
			).select('-password');

			if (!updatedUser) {
				return res.status(404).json({ error: 'User not found' });
			}

			var refreshedToken = null;
			try
			{
				refreshedToken = token.refresh(userJwt);
			}
			catch(e)
			{
				console.log(e.message);
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
				error: '' // ADD JWT
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Could not update profile' });
		}
	});

	// // ─── Export function to set up routes
	// function setApp(appInstance, mongooseInstance) {
	// // Set up the app and mongoose instances
	// app = appInstance;
	// mongoose = mongooseInstance;
	
	// console.log('✅ Social network API endpoints loaded');
	// }

	// module.exports = {
	// setApp
	// }; 
}