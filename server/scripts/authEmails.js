const sgMail = require('@sendgrid/mail');
const emailConfig = require('../config/email');

exports.sendVerifyEmail = async function(email, verifyToken)
{
    if (!email || !verifyToken)
    {
        return {error: "Missing required fields: email, verifyToken"};
    }

    let ret;
    const verifyUrl = `${emailConfig.frontendUrl}/auth/verify-email?token=${verifyToken}`;
    
    const msg = {
        to: email,
        from: emailConfig.senderEmail,
        subject: emailConfig.templates.emailVerify.subject,
        text: emailConfig.templates.emailVerify.generateText(verifyUrl),
        html: emailConfig.templates.emailVerify.generateHtml(verifyUrl)
    };

    try
    {
        await sgMail.send(msg);
        console.log('SendGrid email sent successfully');
        ret = { error: '' };
    }
    catch (sendGridError)
    {
        console.error('SendGrid error:', {
            code: sendGridError.code,
            message: sendGridError.message,
            response: sendGridError.response?.body
        });
        // throw sendGridError;
        ret = { error: 'Failed to send verification email. Please contact support.' };
    }

    return ret;
}

exports.sendRecoveryEmail = async function(email, resetToken)
{

    if (!email || !resetToken)
    {
        return {error: "Missing required fields: email, resetToken"};
    }

    const resetUrl = `${emailConfig.frontendUrl}/auth/reset-password?token=${resetToken}`;
    let ret;

    const msg = {
        to: email,
        from: emailConfig.senderEmail,
        subject: emailConfig.templates.passwordReset.subject,
        text: emailConfig.templates.passwordReset.generateText(resetUrl),
        html: emailConfig.templates.passwordReset.generateHtml(resetUrl)
    };

    try
    {
        await sgMail.send(msg);
        console.log('SendGrid email sent successfully');
        ret = {error:  ''};
    }
    catch (sendGridError)
    {
        console.error('SendGrid error:', {
            code: sendGridError.code,
            message: sendGridError.message,
            response: sendGridError.response?.body
        });
        ret = { error: sendGridError };
        // throw sendGridError;
    }

    return ret;
}

exports.sendVerifiedConfirmationEmail = async function(email)
{
    if (!email) {
        return {error: "Email not present"};
    }
    const msg = {
        to: email,
        from: emailConfig.senderEmail,
        subject: 'Your email has been verified',
        text: 'Your email for Macros has been successfully verified.',
        html: `
            <h1>Email Verification Successful</h1>
            <p>Your email for Macros has been successfully verified.</p>
            <p>If you did not make this change, please contact support immediately.</p>
        `
    };

    try
    {
        await sgMail.send(msg);
        console.log('Email verification confirmation email sent successfully');
    }
    catch (emailError)
    {
        console.error('Failed to send confirmation email:', emailError);
        // Don't return error to client - email was still verified successfully
    }
}

exports.sendRecoveredConfirmationEmail = async function(email)
{
    const msg = {
        to: email,
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
}