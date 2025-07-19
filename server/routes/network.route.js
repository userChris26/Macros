const express = require('express');
const networkController = require('../controllers/network.controller.js');

const networkRoute = express.Router();

networkRoute.post('/api/follow', networkController.followUser);
networkRoute.delete('/api/follow', networkController.unfollowUser);
networkRoute.get('/api/followers/:userId', networkController.getFollowers);
networkRoute.get('/api/following/:userId', networkController.getFollowing);
networkRoute.get('/api/dashboard/stats/:userId', networkController.getDashboardStats);

module.exports = networkRoute;