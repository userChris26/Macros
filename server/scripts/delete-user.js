require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Meal = require('../models/Meal');
const FoodEntry = require('../models/FoodEntry');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const EMAIL_TO_DELETE = 'ma081111@ucf.edu';

async function deleteUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user first
    const user = await User.findOne({ email: EMAIL_TO_DELETE });
    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found user: ${user._id}`);

    // Delete all meals for this user
    const deletedMeals = await Meal.deleteMany({ user: user._id });
    console.log(`Deleted ${deletedMeals.deletedCount} meals`);

    // Delete all food entries for this user
    const deletedFoodEntries = await FoodEntry.deleteMany({ userId: user._id });
    console.log(`Deleted ${deletedFoodEntries.deletedCount} food entries`);

    // Finally delete the user
    await User.deleteOne({ _id: user._id });
    console.log('Deleted user');

    console.log('Cleanup complete!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

deleteUser(); 