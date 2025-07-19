const express = require('express');
const mealController = require('../controllers/meal.controller.js');

const mealRoute = express.Router();

mealRoute.post('/api/meal/photo', mealController.uploadMealPhoto);
mealRoute.delete('/api/meal/photo', mealController.deleteMealPhoto);
mealRoute.get('/api/meal/:userId/:date/:mealType', mealController.getMealDetails);
mealRoute.post('/api/addmeal', mealController.addMeal);
mealRoute.post('/api/getmeals', mealController.getUserMealTemplates);
mealRoute.post('/api/addmealtoday', mealController.addMealTemplateToday);
mealRoute.post('/api/deletemeal', mealController.deleteMealTemplate);
mealRoute.put('/api/updatemeal/:mealId', mealController.updateMealTemplate);
mealRoute.get('/api/meal/:mealId', mealController.getMealTemplate);

module.exports = mealRoute;