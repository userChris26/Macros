const User = require('../models/User.js');
const blake2 = require('blake2');
const authEmails = require('../scripts/authEmails.js');

exports.register = async (req, res) =>
{
	// incoming: userEmail, userPassword, userFirstName, userLastName
	// outgoing: error

	const { userEmail, userPassword, userFirstName, userLastName } = req.body;

	// Validate required fields
    if (!userEmail || !userPassword || !userFirstName || !userLastName)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['userEmail', 'userPassword', 'userFirstName', 'userLastName']
        });
    }

	let ret;
	
	try
	{
		const result = await User.findOne({ email: userEmail });
		
		if (result)
		{
			return res.status(200).json({ error: "Account Already Exists" });
		}

		// Hash the password
		let hash = blake2.createHash('blake2b');
		hash.update(Buffer.from(userPassword));

		// Generate account verification token
		const verifyToken = require('crypto').randomBytes(32).toString('hex');
		const verifyTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

		const newUser = new User(
		{ 
			email: userEmail,
			password: hash.digest('hex'),
			firstName: userFirstName,
			lastName: userLastName,
			isVerified: false,
			verifyToken,
			verifyTokenExpiry
		});
		await newUser.save();

		/*
		// Save verification token to user
		await User.findByIdAndUpdate(
			newUser._id,
			{
				verifyToken,
				verifyTokenExpiry
			}
		);
		*/

		// Send verification email
		ret = authEmails.sendVerifyEmail(verifyToken);
		if (ret && ret.error !== '')
		{
			throw new sendGridError;
		}
	}
	catch(e)
	{
		console.error(e);
		ret = { error: e.message };
	}

	res.status(200).json(ret);
}

exports.login = async (req, res) =>
{
	// incoming: userEmail, userPassword
	// outgoing: accessToken, error

	const { userEmail, userPassword } = req.body;
	
	// Validate required fields
    if (!userEmail || !userPassword)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['userEmail', 'userPassword']
        });
    }

	let ret;

	// Hash the password
	let hash = blake2.createHash('blake2b');
	hash.update(Buffer.from(userPassword));

	const result = await User.findOne({ email: userEmail, password: hash.digest('hex') });
	try
	{
		if (!result)
		{
			return res.status(200).json({ error: "Login/Password incorrect" });
		}

		if (!result.isVerified)
		{
			return res.status(200).json({ 
				error: "Please verify your email before logging in", 
				needsVerification: true
			});
		}

		const token = require("../scripts/createJWT.js");
		const tokenData = token.createToken(result);

		if (tokenData.error)
		{
			ret = { error: tokenData.error };
		}
		else
		{
			ret = { accessToken: tokenData.accessToken, error: '' };
		}
	}
	catch(e)
	{
		ret = { error: e.message };
	}

	res.status(200).json(ret);
}

// Password Reset Endpoints
exports.sendRecoveryEmail = async (req, res) =>
{
	const { email } = req.body;

	// Validate required fields
    if (!email)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['email']
        });
    }
	try {

		// Find user by email
		const user = await User.findOne({ email });

		// Don't reveal if user exists or not
		if (!user)
		{
			return res.status(200).json({ error: '' }); // Success response even if user not found
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
		const ret = authEmails.sendRecoveryEmail(resetToken);
		if (ret && ret.error !== '')
		{
			throw new sendGridError;
		}
	}
	catch (err)
	{
		console.error('Password reset error:', err);
		res.status(500).json({ 
			error: 'Failed to process password reset',
			details: err.response?.body || err.message
		});
	}
}

// Reset Password with Token
exports.recoverEmail = async (req, res) =>
{
	const { token, newPassword } = req.body;

	// Validate required fields
    if (!token || !newPassword)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['token', 'newPassword']
        });
    }

	try {
		
		// Hash the password
		let hash = blake2.createHash('blake2b');
		hash.update(Buffer.from(newPassword));
		
		console.log('Reset password attempt with token:', token);
		
		// Find user with valid reset token
		const user = await User.findOne({
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
		});

		if (!user)
		{
			// Debug why the token is invalid
			const userWithToken = await User.findOne({ resetToken: token });

			if (userWithToken)
			{
				console.log('Token found but expired. Token expiry:', 
					userWithToken.resetTokenExpiry, 
					'Current time:', Date.now());
			}
			else
			{
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
		authEmails.sendRecoveredConfirmationEmail();

		res.status(200).json({ error: '' });
	}
	catch (err)
	{
		console.error('Password reset error:', err);
		res.status(500).json({ error: 'Failed to reset password' });
	}
}

// Email Verification Endpoints
exports.sendVerificationEmail = async (req, res) =>
{
	const { email } = req.body;

	// Validate required fields
    if (!email)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['email']
        });
    }

	try {
		
		// Find user by email
		const user = await User.findOne({ email });
		
		// Don't reveal if user exists or not
		if (!user)
		{
			return res.status(200).json({ error: '' }); // Success response even if user not found
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

		const ret = authEmails.sendVerifyEmail(token);
		if (ret && ret.error !== '')
		{
			throw new sendGridError;
		}
	}
	catch (err)
	{
		console.error('Email verification error:', err);
		res.status(500).json({ 
		error: 'Failed to process email verification',
		details: err.response?.body || err.message
		});
	}
}

// Verify Email with Token
exports.verifyEmail = async (req, res) =>
{
	const { token } = req.body;

	// Validate required fields
    if (!token)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['token']
        });
    }

	try {
		
		console.log('Verify email attempt with token:', token);
		
		// Find user with valid verification token
		const user = await User.findOne({
			verifyToken: token,
			verifyTokenExpiry: { $gt: Date.now() }
		});

		if (!user)
		{
			// Debug why the token is invalid
			const userWithToken = await User.findOne({ verifyToken: token });
			if (userWithToken)
			{
				console.log('Token found but expired. Token expiry:', userWithToken.verifyTokenExpiry, 'Current time:', Date.now());
			}
			else
			{
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
		authEmails.sendVerifiedConfirmationEmail();

		res.status(200).json({ error: '' });
	}
	catch (err)
	{
		console.error('Email verification error:', err);
		res.status(500).json({ error: 'Failed to verify email' });
	}
}

// Test SendGrid Configuration
exports.testEmailConfig = async (req, res) =>
{
	res.json({
		sendgridConfigured: !!process.env.SENDGRID_API_KEY,
		senderEmail: process.env.SENDGRID_SENDER_EMAIL || 'Not configured',
		apiKeyLastFour: process.env.SENDGRID_API_KEY ? 
		`...${process.env.SENDGRID_API_KEY.slice(-4)}` : 'Not configured'
	});
}