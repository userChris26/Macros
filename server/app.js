const express = require('express');
const authRoute = require('./routes/auth.route.js');
const userRoute = require('./routes/user.route.js');
const foodRoute = require('./routes/food.route.js');
const mealRoute = require('./routes/meal.route.js');
const networkRoute = require('./routes/network.route.js');

const app = express.Router();

app.use("/", authRoute);
app.use("/", userRoute);
app.use("/", foodRoute);
app.use("/", mealRoute);
app.use("/", networkRoute);

module.exports = app;