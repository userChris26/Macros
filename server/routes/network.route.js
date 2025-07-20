const express = require('express');
const networkController = require('../controllers/network.controller.js');
const authenticateToken = require('../middlewares/authenticateToken.js');
const refreshToken = require('../middlewares/refreshToken.js')

const networkRoute = express.Router();

networkRoute.use(authenticateToken)

networkRoute.post('/api/follow', networkController.followUser);
networkRoute.delete('/api/follow', networkController.unfollowUser);
networkRoute.get('/api/followers/:userId', networkController.getFollowers);
networkRoute.get('/api/following/:userId', networkController.getFollowing);
networkRoute.get('/api/dashboard/stats/:userId', networkController.getDashboardStats);

networkRoute.use(refreshToken);

module.exports = networkRoute;