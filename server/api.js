const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { cloudinary } = require('./config/cloudinary');
const emailConfig = require('./config/email');
const FoodEntry = require('./models/FoodEntry');
const User = require('./models/user.js');
const Meal = require('./models/Meal');

// Initialize SendGrid
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

//Define schemas for social network features
const UserSchema = new mongoose.Schema({
	firstName:  { type: String, required: true },
	lastName:   { type: String, required: true },
	email:      { type: String, required: true, unique: true },
	password:   { type: String, required: true },
	profilePic: { type: String },
	bio:        { type: String },
	createdAt:  { type: Date,   default: Date.now },
	resetToken: { type: String },
	resetTokenExpiry: { type: Date }
});

const NetworkSchema = new mongoose.Schema({
	followerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	createdAt:   { type: Date, default: Date.now }
});

// Create models
const Network = mongoose.model('Network', NetworkSchema);
const Food = mongoose.model('Food', UserSchema);


exports.setApp = function( app, client )
{

	// ─── Account Endpoints
	app.post('/api/register', async (req, res) =>
	{
		// incoming: email, password, firstName, lastName
		// outgoing: error

    var blake2 = require('blake2');

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
				// Hash the password
				var hash = blake2.createHash('blake2b');
				hash.update(Buffer.from(userPassword));

				const newUser = new User(
				{ 
					email: userEmail,
					password: hash.digest('hex'),
					firstName: userFirstName,
					lastName: userLastName,
					isVerified: false
				});
				await newUser.save();

				// Generate verification token and send email
				const verifyToken = require('crypto').randomBytes(32).toString('hex');
				const verifyTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

				// Save verification token to user
				await User.findByIdAndUpdate(
					newUser._id,
					{
						verifyToken,
						verifyTokenExpiry
					}
				);

				// Send verification email
				const verifyUrl = `${emailConfig.frontendUrl}/auth/verify-email?token=${verifyToken}`;
				const msg = {
					to: userEmail,
					from: emailConfig.senderEmail,
					subject: emailConfig.templates.emailVerify.subject,
					text: emailConfig.templates.emailVerify.generateText(verifyUrl),
					html: emailConfig.templates.emailVerify.generateHtml(verifyUrl)
				};

				try {
					await sgMail.send(msg);
					ret = { error: '', verificationEmailSent: true };
				} catch (emailError) {
					console.error('Failed to send verification email:', emailError);
					ret = { error: 'Account created but failed to send verification email. Please contact support.' };
				}
			}
		}
		catch(e)
		{
			console.error(e);
			ret = { error: e.message };
		}

		res.status(200).json(ret);
	});

	app.post('/api/login', async (req, res) => {
		// incoming: email, password
		// outgoing: accessToken, error

		var blake2 = require('blake2');

		const { userEmail, userPassword } = req.body;
		var ret;

		// Hash the password
		var hash = blake2.createHash('blake2b');
		hash.update(Buffer.from(userPassword));

		const result = await User.findOne({ email: userEmail, password: hash.digest('hex') });
		try {
			if (!result) {
				ret = { error: "Login/Password incorrect" };
			} else {
				if (!result.isVerified) {
					ret = { error: "Please verify your email before logging in", needsVerification: true };
				} else {
					const token = require("./createJWT.js");
					const tokenData = token.createToken(result);

					if (tokenData.error) {
						ret = { error: tokenData.error };
					} else {
						ret = {
							accessToken: tokenData.accessToken,
							error: ''
						};
					}
				}
			}
		} catch(e) {
			ret = { error: e.message };
		}

		res.status(200).json(ret);
	});

	app.post('/api/test-jwt', async (req, res) =>
	{
		// incoming: userJwt
		// outgoing: error

		var token = require('./createJWT.js');

		const { userJwt } = req.body;
		
		// Token Expiration Check
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

		console.log('Token not expired.')
		
		// Token Refresh Attempt
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
	// Search users
	app.get('/api/users/search', async (req, res) => {
		try {
			const { q } = req.query;

			if (!q) {
				return res.status(400).json({ error: 'Search query is required' });
			}

			// Search by first name, last name, or email
			const users = await User.find({
				$or: [
				{ firstName: { $regex: q, $options: 'i' } },
				{ lastName: { $regex: q, $options: 'i' } },
				{ email: { $regex: q, $options: 'i' } }
				]
			})
			.select('firstName lastName email profilePic')
			.limit(10);

			// Transform the response to match our standardized format
			const transformedUsers = users.map(user => ({
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				profilePic: user.profilePic || null
			}));

			res.json({ users: transformedUsers, error: '' });
		} catch (err) {
			console.error('User search error:', err);
			res.status(500).json({ error: 'Failed to search users' });
		}
	});

	// Follow a user
	app.post('/api/follow', async (req, res) => {
		
		var ret;
		var error = '';

		const { followerId, followingId, userJwt } = req.body;
		try {
			
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

			ret = { error: error };
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Could not follow user' });
		}

		res.status(200).json(ret);
	});

	// Unfollow a user
	app.delete('/api/follow', async (req, res) => {
		try {
			const { followerId, followingId } = req.body;
			
			// Check if the connection exists before trying to delete
			const existing = await Network.findOne({ followerId, followingId });
			if (!existing) {
				return res.json({ error: 'Not following this user' });
			}
			
			// Check if trying to unfollow self
			if (followerId === followingId) {
				return res.json({ error: 'Cannot unfollow yourself' });
			}

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
	app.post('/api/upload-profile-pic/:userId', async (req, res) => {
		try {
			const { userId } = req.params;
			const { photoBase64 } = req.body;
			
			if (!photoBase64) {
				return res.status(400).json({ error: 'No photo data provided' });
			}

			// Upload to Cloudinary
			const uploadResponse = await cloudinary.uploader.upload(photoBase64, {
				folder: 'profile_pictures',
				transformation: [
					{ width: 400, height: 400, crop: 'fill', gravity: 'face' },
					{ quality: 'auto', fetch_format: 'auto' }
				]
			});

			// Update user's profile picture URL in database
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ profilePic: uploadResponse.secure_url },
				{ new: true }
			);

			if (!updatedUser) {
				return res.status(404).json({ error: 'User not found' });
			}

			res.json({
				message: 'Profile picture uploaded successfully',
				profilePicUrl: uploadResponse.secure_url,
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
			const { firstName, lastName, bio, userJwt } = req.body;

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

	// Get food entries route
    app.post('/api/getfoodentries', async (req, res) => {
        console.log('=== GET FOOD ENTRIES ROUTE CALLED ===');
        const { userId, date } = req.body;
        
        console.log('Get food entries request:', { userId, date });
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        try {
            const query = { userId: userId };  // No need to parseInt since we store it as string
            
            // If date is provided, filter by date
            if (date) {
                query.dateAdded = date;
            }
            
            const entries = await FoodEntry.find(query);
            console.log('Found', entries.length, 'food entries for user', userId, 'on date', date);

            // Get meal photos for each entry's meal type
            const mealDate = new Date(date);
            mealDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(mealDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const meals = await Meal.find({
                user: userId,
                date: {
                    $gte: mealDate,
                    $lt: nextDay
                }
            });

            // Create a map of mealType -> photo
            const mealPhotoMap = meals.reduce((acc, meal) => {
                if (meal.photo) {
                    acc[meal.mealTime] = meal.photo;
                }
                return acc;
            }, {});

            // Add photo to each entry
            const entriesWithPhotos = entries.map(entry => ({
                ...entry.toObject(),
                mealPhoto: mealPhotoMap[entry.mealType] || null
            }));
            
            // Calculate total calories
            let totalCalories = 0;
            entries.forEach(entry => {
                if (entry.nutrients && entry.nutrients.calories) {
                    totalCalories += parseFloat(entry.nutrients.calories) || 0;
                }
            });
            
            res.json({
                success: true,
                foodEntries: entriesWithPhotos,
                totalCalories: totalCalories.toFixed(1)
            });
        } catch (error) {
            console.error('Get food entries error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Delete food entry route
    app.post('/api/deletefoodentry', async (req, res) => {
        console.log('=== DELETE FOOD ENTRY ROUTE CALLED ===');
        const { userId, entryId } = req.body;
        
        console.log('Delete food entry request:', { userId, entryId });
        
        if (!entryId) {
            return res.status(400).json({ error: 'Entry ID is required' });
        }

        try {
            const result = await FoodEntry.deleteOne({ 
                _id: entryId,
                userId: userId // Also check userId for security
            });
            
            if (result.deletedCount === 1) {
                console.log('Food entry deleted successfully:', entryId);
                res.json({
                    success: true,
                    message: 'Food entry deleted'
                });
            } else {
                res.status(404).json({ error: 'Food entry not found' });
            }
        } catch (error) {
            console.error('Delete food entry error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    
    // Test route for USDA API
    app.get('/api/test-usda', async (req, res) => {
        try {
            console.log('Testing USDA API...');
            const foods = await searchUSDAFood('apple');
            res.json({ 
                success: true, 
                count: foods.length, 
                foods: foods.slice(0, 3),
                message: 'USDA API is working!'
            });
        } catch (error) {
            console.error('USDA API test failed:', error);
            res.json({ 
                success: false, 
                error: error.message,
                message: 'USDA API test failed'
            });
        }
    });

    // Get dashboard stats
    app.get('/api/dashboard/stats/:userId', async (req, res) => {
		try {
			const { userId } = req.params;
			const today = new Date().toISOString().split('T')[0];

			// Get today's food entries
			const foodEntries = await FoodEntry.find({
				userId,
				dateAdded: today
			});

			// Calculate total calories
			const totalCalories = foodEntries.reduce((acc, entry) => 
				acc + parseFloat(entry.nutrients.calories || '0'), 0
			);

			// Get following count
			const followingCount = await Network.countDocuments({ followerId: userId });

			// Get followers count
			const followersCount = await Network.countDocuments({ followingId: userId });

			res.json({
			success: true,
			stats: {
				totalCalories,
				totalEntries: foodEntries.length,
				following: followingCount,
				followers: followersCount
			}
			});
		} catch (err) {
			console.error('Error fetching dashboard stats:', err);
			res.status(500).json({ error: 'Failed to fetch dashboard stats' });
		}
    });

    // Password Reset Endpoints
    app.post('/api/forgot-password', async (req, res) => {
		try {
			const { email } = req.body;

			// Find user by email
			const user = await User.findOne({ email });

			// Don't reveal if user exists or not
			if (!user) {
				return res.json({ error: '' }); // Success response even if user not found
			}

			// Generate reset token (valid for 1 hour)
			const resetToken = require('crypto').randomBytes(32).toString('hex');
			const resetTokenExpiry = new Date(Date.now() + 3600000); // Create a proper Date object

			console.log('Generated reset token for', email, ':', {
				token: resetToken,
				expiry: resetTokenExpiry.toISOString()
			});

			// Save reset token to user
			const updatedUser = await User.findByIdAndUpdate(
				user._id,
				{
					resetToken,
					resetTokenExpiry
				},
				{ new: true }
			);

			console.log('Updated user with reset token:', {
				email: updatedUser.email,
				tokenSaved: updatedUser.resetToken === resetToken,
				expiry: updatedUser.resetTokenExpiry.toISOString()
			});

			// Send email using SendGrid
			const resetUrl = `${emailConfig.frontendUrl}/auth/reset-password?token=${resetToken}`;

			const msg = {
				to: email,
				from: emailConfig.senderEmail,
				subject: emailConfig.templates.passwordReset.subject,
				text: emailConfig.templates.passwordReset.generateText(resetUrl),
				html: emailConfig.templates.passwordReset.generateHtml(resetUrl)
			};

			try {
				await sgMail.send(msg);
				console.log('SendGrid email sent successfully');
				res.json({ error: '' });
			} catch (sendGridError) {
				console.error('SendGrid error:', {
					code: sendGridError.code,
					message: sendGridError.message,
					response: sendGridError.response?.body
				});
				throw sendGridError;
			}
		} catch (err) {
			console.error('Password reset error:', err);
			res.status(500).json({ 
				error: 'Failed to process password reset',
				details: err.response?.body || err.message
			});
		}
    });

    // Reset Password with Token
    app.post('/api/reset-password', async (req, res) => {
		var blake2 = require('blake2');

		try {
			const { token, newPassword } = req.body;
			
			// Hash the password
			var hash = blake2.createHash('blake2b');
			hash.update(Buffer.from(newPassword));
			
			console.log('Reset password attempt with token:', token);
			
			// Find user with valid reset token
			const user = await User.findOne({
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
			});

			if (!user) {
				// Debug why the token is invalid
				const userWithToken = await User.findOne({ resetToken: token });
				if (userWithToken) {
					console.log('Token found but expired. Token expiry:', userWithToken.resetTokenExpiry, 'Current time:', Date.now());
				} else {
					console.log('No user found with token');
				}
				return res.status(400).json({ error: 'Invalid or expired reset token' });
			}

			console.log('Found user for password reset:', user.email);

			// Update password and clear reset token
			await User.findByIdAndUpdate(user._id, {
			password: hash.digest('hex'),
			resetToken: null,
			resetTokenExpiry: null
			});

			// Send confirmation email
			const msg = {
			to: user.email,
			from: emailConfig.senderEmail,
			subject: 'Your password has been reset',
			text: 'Your password for Macros has been successfully reset.',
			html: `
				<h1>Password Reset Successful</h1>
				<p>Your password for Macros has been successfully reset.</p>
				<p>If you did not make this change, please contact support immediately.</p>
			`
			};

			try {
			await sgMail.send(msg);
				console.log('Password reset confirmation email sent successfully');
			} catch (emailError) {
				console.error('Failed to send confirmation email:', emailError);
				// Don't return error to client - password was still reset successfully
			}

			res.json({ error: '' });
		} catch (err) {
			console.error('Password reset error:', err);
			res.status(500).json({ error: 'Failed to reset password' });
		}
    });

	// Email Verification Endpoints
    app.post('/api/send-email-verification', async (req, res) => {
		try {
			const { email } = req.body;
			
			// Find user by email
			const user = await User.findOne({ email });
			
			// Don't reveal if user exists or not
			if (!user) {
				return res.json({ error: '' }); // Success response even if user not found
			}

			// Generate reset token (valid for 1 hour)
			const verifyToken = require('crypto').randomBytes(32).toString('hex');
			const verifyTokenExpiry = new Date(Date.now() + 3600000); // Create a proper Date object

			console.log('Generated verification token for', email, ':', {
				token: verifyToken,
				expiry: verifyTokenExpiry.toISOString()
			});

			// Save verification token to user
			const updatedUser = await User.findByIdAndUpdate(
				user._id,
				{
					verifyToken,
					verifyTokenExpiry
				},
				{ new: true }
			);

			console.log('Updated user with verification token:', {
				email: updatedUser.email,
				tokenSaved: updatedUser.verifyToken === verifyToken,
				expiry: updatedUser.verifyTokenExpiry.toISOString()
			});

			// Send email using SendGrid
			const verifyUrl = `${emailConfig.frontendUrl}/auth/verify-email?token=${verifyToken}`;
			
			const msg = {
				to: email,
				from: emailConfig.senderEmail,
				subject: emailConfig.templates.emailVerify.subject,
				text: emailConfig.templates.emailVerify.generateText(verifyUrl),
				html: emailConfig.templates.emailVerify.generateHtml(verifyUrl)
			};

			try {
				await sgMail.send(msg);
				console.log('SendGrid email sent successfully');
				res.json({ error: '' });
			} catch (sendGridError) {
				console.error('SendGrid error:', {
					code: sendGridError.code,
					message: sendGridError.message,
					response: sendGridError.response?.body
				});
				throw sendGridError;
			}
		} catch (err) {
			console.error('Email verification error:', err);
			res.status(500).json({ 
			error: 'Failed to process email verification',
			details: err.response?.body || err.message
			});
		}
    });

    // Verify Email with Token
    app.post('/api/verify-email', async (req, res) => {
		try {
			const { token } = req.body;
			
			console.log('Verify email attempt with token:', token);
			
			// Find user with valid verification token
			const user = await User.findOne({
				verifyToken: token,
				verifyTokenExpiry: { $gt: Date.now() }
			});

			if (!user) {
				// Debug why the token is invalid
				const userWithToken = await User.findOne({ verifyToken: token });
				if (userWithToken) {
					console.log('Token found but expired. Token expiry:', userWithToken.verifyTokenExpiry, 'Current time:', Date.now());
				} else {
					console.log('No user found with token');
				}
				return res.status(400).json({ error: 'Invalid or expired reset token' });
			}

			console.log('Found user for email verification:', user.email);

			// Update password and clear reset token
			await User.findByIdAndUpdate(user._id, {
				isVerified: true,
				verifyToken: null,
				verifyTokenExpiry: null
			});

			// Send confirmation email
			const msg = {
				to: user.email,
				from: emailConfig.senderEmail,
				subject: 'Your email has been verified',
				text: 'Your email for Macros has been successfully verified.',
				html: `
					<h1>Email Verification Successful</h1>
					<p>Your email for Macros has been successfully verified.</p>
					<p>If you did not make this change, please contact support immediately.</p>
				`
			};

			try {
				await sgMail.send(msg);
				console.log('Email verification confirmation email sent successfully');
			} catch (emailError) {
				console.error('Failed to send confirmation email:', emailError);
				// Don't return error to client - email was still verified successfully
			}

			res.json({ error: '' });
		} catch (err) {
			console.error('Email verification error:', err);
			res.status(500).json({ error: 'Failed to verify email' });
		}
    });

    // Test SendGrid Configuration
    app.get('/api/test-email-config', (req, res) => {
		res.json({
			sendgridConfigured: !!process.env.SENDGRID_API_KEY,
			senderEmail: process.env.SENDGRID_SENDER_EMAIL || 'Not configured',
			apiKeyLastFour: process.env.SENDGRID_API_KEY ? 
			`...${process.env.SENDGRID_API_KEY.slice(-4)}` : 'Not configured'
		});
    });

    // Add or update meal photo
    app.post('/api/meal/photo', async (req, res) => {
      try {
        const { userId, date, mealType, photoBase64 } = req.body;

        if (!userId || !date || !mealType || !photoBase64) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
          });
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(photoBase64, {
          folder: 'meal_photos',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        // Find or create meal
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(mealDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let meal = await Meal.findOne({
          user: userId,
          date: {
            $gte: mealDate,
            $lt: nextDay
          },
          mealTime: mealType
        });

        if (!meal) {
          meal = new Meal({
            user: userId,
            date: mealDate,
            mealTime: mealType,
            foods: []
          });
        }

        // If meal already had a photo, delete old one from Cloudinary
        if (meal.photo && meal.photo.publicId) {
          await cloudinary.uploader.destroy(meal.photo.publicId);
        }

        meal.photo = {
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id
        };

        await meal.save();

        res.json({
          success: true,
          meal
        });

      } catch (error) {
        console.error('Error handling meal photo:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to handle meal photo'
        });
      }
    });

    // Delete meal photo
    app.delete('/api/meal/photo', async (req, res) => {
      try {
        const { userId, date, mealType } = req.body;

        const mealDate = new Date(date);
        const meal = await Meal.findOne({
          user: userId,
          date: {
            $gte: new Date(mealDate.setHours(0, 0, 0)),
            $lt: new Date(mealDate.setHours(23, 59, 59))
          },
          mealTime: mealType
        });

        if (!meal) {
          return res.status(404).json({
            success: false,
            error: 'Meal not found'
          });
        }

        if (meal.photo && meal.photo.publicId) {
          await cloudinary.uploader.destroy(meal.photo.publicId);
          meal.photo = undefined;
          await meal.save();
        }

        res.json({
          success: true,
          meal
        });

      } catch (error) {
        console.error('Error deleting meal photo:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete meal photo'
        });
      }
    });

    // Get meal details including photo
    app.get('/api/meal/:userId/:date/:mealType', async (req, res) => {
      try {
        const { userId, date, mealType } = req.params;
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(mealDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const meal = await Meal.findOne({
          user: userId,
          date: {
            $gte: mealDate,
            $lt: nextDay
          },
          mealTime: mealType
        }).populate({
          path: 'foods',
          model: 'FoodEntry'
        });

        if (meal) {
          console.log('Found meal:', {
            mealId: meal._id,
            mealTime: meal.mealTime,
            foodCount: meal.foods.length,
            foods: meal.foods.map(food => ({
              id: food._id,
              description: food.description,
              servingAmount: food.servingAmount,
              nutrients: food.nutrients
            }))
          });
        }

        res.json({
          success: true,
          meal
        });

      } catch (error) {
        console.error('Error fetching meal:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch meal'
        });
      }
    });

// MEAL APIs

// Add meal route
app.post('/api/addmeal', async (req, res) => {
    console.log('=== ADD MEAL ROUTE CALLED ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { userId, mealName, mealType, foodItems, date } = req.body;
        
        console.log('Parsed fields:', { userId, mealName, mealType, foodItems, date });
        
        // Validation
        if (!userId || !mealName || !foodItems || foodItems.length === 0) {
            console.log('ADD MEAL ERROR: Missing required fields');
            return res.status(400).json({ 
                error: 'userId, mealName, and foodItems are required',
                received: { userId, mealName, foodItems }
            });
        }

        // Calculate total nutrition for the meal
        let totalNutrients = {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        };
        
        foodItems.forEach(item => {
            if (item.nutrients) {
                totalNutrients.calories += parseFloat(item.nutrients.calories) || 0;
                totalNutrients.protein += parseFloat(item.nutrients.protein) || 0;
                totalNutrients.carbohydrates += parseFloat(item.nutrients.carbohydrates) || 0;
                totalNutrients.fat += parseFloat(item.nutrients.fat) || 0;
                totalNutrients.fiber += parseFloat(item.nutrients.fiber) || 0;
                totalNutrients.sugar += parseFloat(item.nutrients.sugar) || 0;
                totalNutrients.sodium += parseFloat(item.nutrients.sodium) || 0;
            }
        });
        
        // Round to 1 decimal place
        Object.keys(totalNutrients).forEach(key => {
            totalNutrients[key] = totalNutrients[key].toFixed(1);
        });
        
        // Create new meal using Mongoose model
        const newMeal = new Meal({
            user: userId,
            mealName: mealName,
            mealTime: mealType || 'custom', // breakfast, lunch, dinner, snack, custom
            foods: foodItems.map(item => ({
                fdcId: item.fdcId,
                foodName: item.foodName,
                brandOwner: item.brandOwner || '',
                servingSize: item.servingSize,
                servingSizeUnit: item.servingSizeUnit || 'g',
                nutrients: item.nutrients
            })),
            totalNutrients: totalNutrients,
            date: date ? new Date(date) : new Date(),
            isTemplate: true // Mark as reusable template
        });
        
        console.log('New meal to insert:', JSON.stringify(newMeal, null, 2));
        
        const result = await newMeal.save();
        console.log('Meal added successfully:', result._id);
        
        res.json({
            success: true,
            message: 'Meal has been created successfully',
            mealId: result._id,
            meal: result
        });
        
    } catch (error) {
        console.error('ADD MEAL ERROR:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to add meal',
            details: error.message
        });
    }
});

// Get user's meal templates
app.post('/api/getmeals', async (req, res) => {
    console.log('=== GET MEALS ROUTE CALLED ===');
    const { userId, date } = req.body;
    
    console.log('Get meals request:', { userId, date });
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const query = { 
            user: userId,
            isTemplate: true // Only get meal templates
        };
        
        // If date is provided, filter by date
        if (date) {
            const mealDate = new Date(date);
            mealDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(mealDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.date = {
                $gte: mealDate,
                $lt: nextDay
            };
        }
        
        const userMeals = await Meal.find(query).sort({ createdAt: -1 });
        console.log('Found', userMeals.length, 'meal templates for user', userId);
        
        // Transform to match Flutter app expectations
        const transformedMeals = userMeals.map(meal => ({
            _id: meal._id,
            mealName: meal.mealName,
            mealType: meal.mealTime,
            foodItems: meal.foods,
            totalNutrients: meal.totalNutrients,
            dateCreated: meal.date.toISOString().split('T')[0]
        }));
        
        res.json({
            success: true,
            meals: transformedMeals
        });
    } catch (error) {
        console.error('Get meals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add meal template to daily log
app.post('/api/addmealtoday', async (req, res) => {
    console.log('=== ADD MEAL TO TODAY ROUTE CALLED ===');
    const { userId, mealId, date } = req.body;
    
    console.log('Add meal to today request:', { userId, mealId, date });
    
    if (!userId || !mealId) {
        return res.status(400).json({ error: 'User ID and Meal ID are required' });
    }

    try {
        // Get the meal template
        const mealTemplate = await Meal.findOne({ 
            _id: mealId,
            user: userId,
            isTemplate: true
        });
        
        if (!mealTemplate) {
            return res.status(404).json({ error: 'Meal template not found' });
        }
        
        // Add each food item from the meal to today's food entries
        const today = date || new Date().toISOString().split('T')[0];
        const addedEntries = [];
        
        for (const foodItem of mealTemplate.foods) {
            const newFoodEntry = new FoodEntry({
                userId: userId,
                fdcId: foodItem.fdcId,
                foodName: foodItem.foodName,
                brandOwner: foodItem.brandOwner || '',
                servingSize: foodItem.servingSize,
                servingSizeUnit: foodItem.servingSizeUnit || 'g',
                mealType: mealTemplate.mealTime,
                nutrients: foodItem.nutrients,
                dateAdded: today,
                timestamp: new Date().toISOString(),
                mealName: mealTemplate.mealName // Track which meal this came from
            });
            
            const result = await newFoodEntry.save();
            addedEntries.push(result);
        }
        
        console.log('Added', addedEntries.length, 'food entries from meal', mealTemplate.mealName);
        
        res.json({
            success: true,
            message: `Added ${mealTemplate.mealName} to today's log`,
            addedEntries: addedEntries
        });
        
    } catch (error) {
        console.error('Add meal to today error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete meal template
app.post('/api/deletemeal', async (req, res) => {
    console.log('=== DELETE MEAL ROUTE CALLED ===');
    const { userId, mealId } = req.body;
    
    console.log('Delete meal request:', { userId, mealId });
    
    if (!mealId) {
        return res.status(400).json({ error: 'Meal ID is required' });
    }

    try {
        const result = await Meal.deleteOne({ 
            _id: mealId,
            user: userId, // Security check - only delete user's own meals
            isTemplate: true
        });
        
        if (result.deletedCount === 1) {
            console.log('Meal deleted successfully:', mealId);
            res.json({
                success: true,
                message: 'Meal deleted'
            });
        } else {
            res.status(404).json({ error: 'Meal not found' });
        }
    } catch (error) {
        console.error('Delete meal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update meal template
app.put('/api/updatemeal/:mealId', async (req, res) => {
    console.log('=== UPDATE MEAL ROUTE CALLED ===');
    const { mealId } = req.params;
    const { userId, mealName, mealType, foodItems } = req.body;
    
    console.log('Update meal request:', { mealId, userId, mealName, mealType });
    
    if (!userId || !mealName || !foodItems || foodItems.length === 0) {
        return res.status(400).json({ 
            error: 'userId, mealName, and foodItems are required'
        });
    }

    try {
        // Calculate total nutrition for the updated meal
        let totalNutrients = {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        };
        
        foodItems.forEach(item => {
            if (item.nutrients) {
                totalNutrients.calories += parseFloat(item.nutrients.calories) || 0;
                totalNutrients.protein += parseFloat(item.nutrients.protein) || 0;
                totalNutrients.carbohydrates += parseFloat(item.nutrients.carbohydrates) || 0;
                totalNutrients.fat += parseFloat(item.nutrients.fat) || 0;
                totalNutrients.fiber += parseFloat(item.nutrients.fiber) || 0;
                totalNutrients.sugar += parseFloat(item.nutrients.sugar) || 0;
                totalNutrients.sodium += parseFloat(item.nutrients.sodium) || 0;
            }
        });
        
        // Round to 1 decimal place
        Object.keys(totalNutrients).forEach(key => {
            totalNutrients[key] = totalNutrients[key].toFixed(1);
        });

        const updatedMeal = await Meal.findOneAndUpdate(
            { 
                _id: mealId,
                user: userId,
                isTemplate: true
            },
            {
                mealName,
                mealTime: mealType,
                foods: foodItems.map(item => ({
                    fdcId: item.fdcId,
                    foodName: item.foodName,
                    brandOwner: item.brandOwner || '',
                    servingSize: item.servingSize,
                    servingSizeUnit: item.servingSizeUnit || 'g',
                    nutrients: item.nutrients
                })),
                totalNutrients
            },
            { new: true }
        );

        if (!updatedMeal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        console.log('Meal updated successfully:', mealId);
        
        res.json({
            success: true,
            message: 'Meal updated successfully',
            meal: updatedMeal
        });
        
    } catch (error) {
        console.error('Update meal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get meal template details
app.get('/api/meal/:mealId', async (req, res) => {
    console.log('=== GET MEAL DETAILS ROUTE CALLED ===');
    const { mealId } = req.params;
    const { userId } = req.query;
    
    console.log('Get meal details request:', { mealId, userId });
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const meal = await Meal.findOne({
            _id: mealId,
            user: userId,
            isTemplate: true
        });

        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        // Transform to match Flutter app expectations
        const transformedMeal = {
            _id: meal._id,
            mealName: meal.mealName,
            mealType: meal.mealTime,
            foodItems: meal.foods,
            totalNutrients: meal.totalNutrients,
            dateCreated: meal.date.toISOString().split('T')[0]
        };

        res.json({
            success: true,
            meal: transformedMeal
        });
        
    } catch (error) {
        console.error('Get meal details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get food details by ID
app.get('/api/food/:fdcId', async (req, res) => {
    const { fdcId } = req.params;
    
    try {
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&nutrients=203,204,205,208`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const data = await response.json();

        // Get portion info
        const portion = data.foodPortions?.[0] || { gramWeight: 100 };
        const servingsPerHundredGrams = Math.round(100 / portion.gramWeight);

        // Extract the nutrients we want
        const nutrients = {};
        data.foodNutrients?.forEach(nutrient => {
            switch (nutrient.nutrient?.id) {
                case 1008: // Energy
                    nutrients.calories = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1003: // Protein
                    nutrients.protein = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1004: // Total lipid (fat)
                    nutrients.fat = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1005: // Carbohydrate
                    nutrients.carbohydrates = nutrient.amount / servingsPerHundredGrams;
                    break;
            }
        });

        // Format the response
        const result = {
            fdcId: data.fdcId,
            description: data.description,
            dataType: data.dataType,
            nutrients,
            portion: {
                gramWeight: portion.gramWeight,
                servingsPerHundredGrams,
                modifier: portion.modifier,
                measureUnit: portion.measureUnit?.name
            }
        };

        res.json({
            success: true,
            food: result
        });
    } catch (error) {
        console.error('Error fetching food details:', error);
        res.status(500).json({ 
            error: 'Failed to fetch food details',
            details: error.message 
        });
    }
});


// Food search endpoint
app.get('/api/searchfoods', async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=25`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the response to include brand info for branded foods
        const foods = data.foods?.map(food => {
            const result = {
                fdcId: food.fdcId,
                description: food.description,
                dataType: food.dataType
            };

            // Add brand info if it's a branded food
            if (food.dataType === 'Branded') {
                result.brandOwner = food.brandOwner;
                result.brandName = food.brandName;
            }

            return result;
        }) || [];

        res.json({
            success: true,
            foods: foods
        });
    } catch (error) {
        console.error('Error searching foods:', error);
        res.status(500).json({ 
            error: 'Failed to search foods',
            details: error.message 
        });
    }
});

// Add food entry for user
app.post('/api/addfood', async (req, res) => {
    const { userId, fdcId, servingAmount, mealType, date } = req.body;

    // Validate required fields
    if (!userId || !fdcId || !servingAmount || !mealType) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['userId', 'fdcId', 'servingAmount', 'mealType']
        });
    }

    try {
        // First get the food details from USDA
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&nutrients=203,204,205,208`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const foodData = await response.json();

        // Get portion info
        const portion = foodData.foodPortions?.[0] || { gramWeight: 100, measureUnit: { name: 'serving' } };

        // Calculate conversion factor from 100g to total amount (per serving * number of servings)
        const conversionFactor = (portion.gramWeight / 100) * servingAmount;

        // Extract nutrients (USDA API returns values per 100g, we convert to total amount)
        const nutrients = {};
        foodData.foodNutrients?.forEach(nutrient => {
            switch (nutrient.nutrient?.id) {
                case 1008: // Energy
                    nutrients.calories = nutrient.amount * conversionFactor;
                    break;
                case 1003: // Protein
                    nutrients.protein = nutrient.amount * conversionFactor;
                    break;
                case 1004: // Total lipid (fat)
                    nutrients.fat = nutrient.amount * conversionFactor;
                    break;
                case 1005: // Carbohydrate
                    nutrients.carbohydrates = nutrient.amount * conversionFactor;
                    break;
            }
        });

        // Create the food entry
        const foodEntry = new FoodEntry({
            userId,
            fdcId,
            description: foodData.description,
            dataType: foodData.dataType,
            // Add brand info if it's a branded food
            ...(foodData.dataType === 'Branded' && {
                brandOwner: foodData.brandOwner,
                brandName: foodData.brandName
            }),
            servingAmount,
            servingUnit: portion.measureUnit?.name || 'serving',
            gramWeight: portion.gramWeight,
            nutrients,
            mealType,
            date: date ? new Date(date) : new Date()
        });

        // Save the food entry
        const savedFoodEntry = await foodEntry.save();

        // Find or create the meal for this entry
        const entryDate = foodEntry.date;
        entryDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(entryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let meal = await Meal.findOne({
            user: userId,
            date: {
                $gte: entryDate,
                $lt: nextDay
            },
            mealTime: mealType
        });

        if (!meal) {
            // Create new meal if it doesn't exist
            meal = new Meal({
                user: userId,
                date: entryDate,
                mealTime: mealType,
                foods: [savedFoodEntry._id]
            });
        } else {
            // Add food entry to existing meal
            meal.foods.push(savedFoodEntry._id);
        }

        await meal.save();

        res.json({
            success: true,
            message: 'Food entry added successfully',
            entry: savedFoodEntry,
            meal: meal
        });
        console.log('Food entry added successfully:', savedFoodEntry);

    } catch (error) {
        console.error('Error adding food entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add food entry',
            details: error.message
        });
    }
});

// Delete user and all associated data
app.delete('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user first to check if exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete all associated data
        await Promise.all([
            // Delete user's food entries
            FoodEntry.deleteMany({ user: userId }),
            // Delete user's meals
            Meal.deleteMany({ user: userId }),
            // Delete network connections (both following and followers)
            Network.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }),
            // Delete the user's profile picture from Cloudinary if it exists
            user.profilePic ? cloudinary.uploader.destroy(`profile_pictures/${user.profilePic.split('/').pop().split('.')[0]}`) : Promise.resolve(),
            // Finally delete the user
            User.findByIdAndDelete(userId)
        ]);

        res.json({ error: '', message: 'User and associated data deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
}
