const express = require('express');
const mongoose = require('mongoose');
const { cloudinary, upload } = require('./config/cloudinary');
const sgMail = require('@sendgrid/mail');
const emailConfig = require('./config/email');
const FoodEntry = require('./models/FoodEntry');
const User = require('./models/user');

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
const Meal = mongoose.model('Meal', UserSchema);


// USDA Food API search function
async function searchUSDAFood(query) {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  console.log('Searching USDA API for:', query);
  console.log('Using API key:', apiKey ? 'API key loaded' : 'No API key');
  
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=25`;
    console.log('USDA API URL:', url);
    
    const response = await fetch(url);
    console.log('USDA API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('USDA API response received, foods count:', data.foods ? data.foods.length : 0);
    
    return data.foods || [];
  } catch (error) {
    console.error('Error searching USDA API:', error);
    throw error;
  }
}


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
				firstName: userFirstName,
				lastName: userLastName
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

	app.post('/api/login', async (req, res) => {
		// incoming: email, password
		// outgoing: accessToken, error

		const { userEmail, userPassword } = req.body;
		var ret;
				
		const result = await User.findOne({ email:userEmail, password:userPassword });
		try {
			if (!result) {
				ret = { error: "Login/Password incorrect" };
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
		} catch(e) {
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
		// var token = require('./createJWT.js');
		var ret;
		var error = '';

		const { followerId, followingId, userJwt } = req.body;
		try {
			// try {
			// 	if (token.isExpired(userJwt)) {
			// 		ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
			// 		return;
			// 	}
			// }
			// catch(e) {
			// 	error = e.toString();
			// }
			
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

			// var refreshedToken = null;
			// try {
			// 	refreshedToken = token.refresh(userJwt);
			// }
			// catch(e) {
			// 	error = e.toString();
			// }

			ret = { error: error, /*userJwt: refreshedToken*/ };
		} catch (err) {
			console.error(err);
			// res.status(500).json({ error: 'Could not follow user' });
		}

		res.status(200).json(ret);
	});

	// Unfollow a user
	app.delete('/api/follow', async (req, res) => {
		// var token = require('./createJWT.js');
		var ret;
		var error = '';

		try {
			const { followerId, followingId, userJwt } = req.body;

			// try {
			// 	if (token.isExpired(userJwt)) {
			// 		ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
			// 		return;
			// 	}
			// }
			// catch(e) {
			// 	console.log(e.message);
			// }

			await Network.findOneAndDelete({ followerId, followingId });

			// var refreshedToken = null;
			// try
			// {
			// 	refreshedToken = token.refresh(userJwt);
			// }
			// catch(e)
			// {
			// 	console.log(e.message);
			// }

			ret = { error: error, /*userJwt: refreshedToken*/ };
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
		// var token = require('./createJWT.js');

		try {
			const { userId } = req.params;
			const { firstName, lastName, bio, userJwt } = req.body;
	
			// try
			// {
			// 	if (token.isExpired(userJwt))
			// 	{
			// 		ret.status(200).json({error: 'The JWT is no longer valid', userJwt: ''});
			// 		return;
			// 	}
			// }
			// catch(e)
			// {
			// 	console.log(e.message);
			// }

			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ firstName, lastName, bio },
				{ new: true }
			).select('-password');

			if (!updatedUser) {
				return res.status(404).json({ error: 'User not found' });
			}

			// var refreshedToken = null;
			// try
			// {
			// 	refreshedToken = token.refresh(userJwt);
			// }
			// catch(e)
			// {
			// 	console.log(e.message);
			// }

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

	app.put('/api/update-password/:userId', async (req, res) => {

		try {
			const { userId } = req.params;
			const { password } = req.body;

			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ password },
				{ new: true }
			);//.select('-password');

			if (!updatedUser) {
				return res.status(404).json({ error: 'User not found' });
			}

			res.json({
				message: 'Password updated successfully',
				error: ''
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Could not update password' });
		}
	});



	// ─── Food Endpoints
    app.post('/api/searchfoods', async (req, res) => {
        console.log('=== SEARCH FOODS ROUTE CALLED ===');
        const { query } = req.body;
        
        console.log('Food search request:', { query });
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        try {
            const foods = await searchUSDAFood(query);
            console.log('Returning', foods.length, 'foods');
            res.json({
                success: true,
                foods: foods
            });
        } catch (error) {
            console.error('Error searching USDA API:', error);
            res.status(500).json({ 
                error: 'Failed to search foods',
                details: error.message 
            });
        }
    });

	// Add food route
    app.post('/api/addfood', async (req, res) => {
        console.log('=== ADD FOOD ROUTE CALLED ===');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        
        try {
            const { userId, fdcId, servingSize, date } = req.body;
            
            console.log('Parsed fields:', { userId, fdcId, servingSize, date });
            
            // Validation
            if (!userId || !fdcId || !servingSize) {
                console.log('ADD FOOD ERROR: Missing required fields');
                return res.status(400).json({ 
                    error: 'userId, fdcId, and servingSize are required',
                    received: { userId, fdcId, servingSize }
                });
            }

            // First, get food details from USDA API
            console.log('Fetching food details from USDA API for fdcId:', fdcId);
            const foodDetailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${process.env.USDA_API_KEY || 'DEMO_KEY'}`;
            const foodResponse = await fetch(foodDetailsUrl);
            
            if (!foodResponse.ok) {
                throw new Error(`Failed to fetch food details: ${foodResponse.status}`);
            }
            
            const foodData = await foodResponse.json();
            console.log('Food data received:', foodData.description);
            
            // Extract nutrition data
            const nutrients = {};
            if (foodData.foodNutrients) {
                foodData.foodNutrients.forEach(nutrient => {
                    const name = nutrient.nutrient?.name?.toLowerCase();
                    if (name) {
                        if (name.includes('energy') || name.includes('calorie')) {
                            nutrients.calories = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('protein')) {
                            nutrients.protein = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('carbohydrate')) {
                            nutrients.carbohydrates = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('fat') && !name.includes('fatty')) {
                            nutrients.fat = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('fiber')) {
                            nutrients.fiber = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('sugar')) {
                            nutrients.sugar = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('sodium')) {
                            nutrients.sodium = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        }
                    }
                });
            }

            const newFoodEntry = new FoodEntry({
                userId: userId,
                fdcId: parseInt(fdcId),
                foodName: foodData.description || 'Unknown Food',
                brandOwner: foodData.brandOwner || '',
                servingSize: parseFloat(servingSize),
                servingSizeUnit: 'g',
                nutrients: {
                    calories: nutrients.calories || '0',
                    protein: nutrients.protein || '0', 
                    carbohydrates: nutrients.carbohydrates || '0',
                    fat: nutrients.fat || '0',
                    fiber: nutrients.fiber || '0',
                    sugar: nutrients.sugar || '0',
                    sodium: nutrients.sodium || '0'
                },
                dateAdded: date || new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            });
            
            console.log('New food entry to insert:', JSON.stringify(newFoodEntry, null, 2));
            
            const result = await newFoodEntry.save();
            console.log('Food entry added successfully:', result._id);
            
            res.json({
                success: true,
                message: 'Food has been added to your diary',
                entryId: result._id,
                entry: newFoodEntry
            });
            
        } catch (error) {
            console.error('ADD FOOD ERROR:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to add food entry',
                details: error.message
            });
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
            
            // Calculate total calories
            let totalCalories = 0;
            entries.forEach(entry => {
                if (entry.nutrients && entry.nutrients.calories) {
                    totalCalories += parseFloat(entry.nutrients.calories) || 0;
                }
            });
            
            res.json({
                success: true,
                foodEntries: entries,
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
      try {
        const { token, newPassword } = req.body;
        
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
          password: newPassword,
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

    // Test SendGrid Configuration
    app.get('/api/test-email-config', (req, res) => {
      res.json({
        sendgridConfigured: !!process.env.SENDGRID_API_KEY,
        senderEmail: process.env.SENDGRID_SENDER_EMAIL || 'Not configured',
        apiKeyLastFour: process.env.SENDGRID_API_KEY ? 
          `...${process.env.SENDGRID_API_KEY.slice(-4)}` : 'Not configured'
      });
    });
}