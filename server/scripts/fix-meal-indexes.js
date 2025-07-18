require('dotenv').config();
const mongoose = require('mongoose');
const Meal = require('../models/Meal');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

async function fixIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop all existing indexes except _id
    const indexes = await Meal.collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        await Meal.collection.dropIndex(index.name);
      }
    }

    // Create the correct compound index
    console.log('Creating new compound index...');
    await Meal.collection.createIndex(
      { user: 1, date: 1, mealTime: 1 },
      { unique: true }
    );

    console.log('Index fix complete!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes(); 