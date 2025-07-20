const express = require('express');
const userController = require('../controllers/user.controller.js');
const authenticateToken = require('../middlewares/authenticateToken.js');
const refreshToken = require('../middlewares/refreshToken.js');

const userRoute = express.Router();

userRoute.use(authenticateToken);

userRoute.get('/api/users/search', userController.searchUser);
userRoute.post('/api/upload-profile-pic/:userId', userController.uploadProfilePic);
userRoute.delete('/api/delete-profile-pic/:userId', userController.deleteProfilePic);
userRoute.get('/api/user/:userId', userController.getUser);
userRoute.put('/api/user/:userId', userController.updateUser);
userRoute.delete('/api/user/:userId', userController.deleteUser);

userRoute.use(refreshToken);

module.exports = userRoute;