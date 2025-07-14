// models/Food.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

module.exports = mongoose.model('Food', new Schema({
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  foodName:    { type: String, required: true },
  calories:    { type: Number },
  protein:     { type: Number },
  carbs:       { type: Number },
  fats:        { type: Number },
  portionSize: { type: String },
  mealTime:    { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
    default: 'breakfast'
  },
  meal: { type: Schema.Types.ObjectId, ref: 'Meal' },
  date:        { type: Date },     // when they ate it
  createdAt:   { type: Date, default: Date.now }
}));