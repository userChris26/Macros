const User = require('../models/User.js');
const sgMail = require('@sendgrid/mail');
const blake2 = require('blake2');

// const User = require('../models/User');
// const sgMail = require('@sendgrid/mail');

exports.register = async (req, res) =>
{
	// incoming: email, password, firstName, lastName
	// outgoing: error

	const { userEmail, userPassword, userFirstName, userLastName } = req.body;
	var ret;
	
	try
	{
		const result = await User.findOne({ email: userEmail });
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
}

exports.login = async (req, res) =>
{
	// incoming: email, password
	// outgoing: accessToken, error

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
				const token = require("../scripts/createJWT.js");
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
}

// Password Reset Endpoints
exports.sendEmailRecovery = async (req, res) =>
{
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
}

// Reset Password with Token
exports.recoverEmail = async (req, res) =>
{
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
}

// Email Verification Endpoints
exports.sendEmailVerification = async (req, res) =>
{
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
}

// Verify Email with Token
exports.verifyEmail = async (req, res) =>
{
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