const express = require('express');
const authController = require('../controllers/auth.controller.js');

const authRoute = express.Router();

authRoute.post('/api/register', authController.register);
authRoute.post('/api/login', authController.login);
authRoute.post('/api/send-email-verification', authController.sendEmailVerification);
authRoute.post('/api/verify-email', authController.verifyEmail);
authRoute.post('/api/forgot-password', authController.sendEmailRecovery);
authRoute.post('/api/reset-password', authController.recoverEmail);
authRoute.get('/api/test-email-config', authController.testEmailConfig);

module.exports = authRoute;