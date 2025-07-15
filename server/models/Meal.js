// models/Meal.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MealSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mealTime: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  date: { type: Date, required: true },
  foods: [{ type: Schema.Types.ObjectId, ref: 'FoodEntry' }],
  photo: {
    url: String,
    publicId: String // for Cloudinary
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure one meal type per user per day
MealSchema.index({ user: 1, date: 1, mealTime: 1 }, { unique: true });

module.exports = mongoose.model('Meal', MealSchema); 