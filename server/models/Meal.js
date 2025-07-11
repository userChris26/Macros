// models/Meal.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MealSchema = new Schema({
  user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mealTime: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  date:     { type: Date, required: true },
  foods:    [{ type: Schema.Types.ObjectId, ref: 'Food' }]
});

module.exports = mongoose.model('Meal', MealSchema); 