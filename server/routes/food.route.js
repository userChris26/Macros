const express = require('express');
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/authenticateToken.js');
const refreshToken = require('../middlewares/refreshToken.js');

const foodRoute = express.Router();

// foodRoute.use(authenticateToken);

foodRoute.post('/api/getfoodentries', foodController.getFoodEntries);
foodRoute.post('/api/deletefoodentry', foodController.deleteFoodEntry);
foodRoute.get('/api/food/:fdcId', foodController.getFoodDetails);
foodRoute.get('/api/searchfoods', foodController.searchFood);
foodRoute.post('/api/addfood', foodController.addFood);
foodRoute.get('/api/test-usda', foodController.testUSDA);

// foodRoute.use(refreshToken);

module.exports = foodRoute;