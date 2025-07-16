// migrate-database.js
// Migration script for meal tracking schema improvements
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Food = require('./models/Food');
const Meal = require('./models/Meal');
const Post = require('./models/Post');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Ensure all foods have mealTime and date fields
  const foodsMissingFields = await Food.updateMany(
    { $or: [ { mealTime: { $exists: false } }, { date: { $exists: false } } ] },
    { $set: { mealTime: 'breakfast', date: new Date() } }
  );
  console.log(`Updated ${foodsMissingFields.nModified || foodsMissingFields.modifiedCount} foods missing mealTime or date.`);

  // 2. Group orphaned foods (not linked to a meal) by user/date/mealTime
  const orphanedFoods = await Food.find({ $or: [ { meal: { $exists: false } }, { meal: null } ] });
  const grouped = {};
  for (const food of orphanedFoods) {
    const key = `${food.user}_${food.date ? food.date.toISOString().split('T')[0] : 'nodate'}_${food.mealTime}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(food);
  }

  let createdMeals = 0;
  for (const key in grouped) {
    const foods = grouped[key];
    if (foods.length === 0) continue;
    const { user, date, mealTime } = foods[0];
    // Check if a meal already exists for this user/date/mealTime
    let meal = await Meal.findOne({ user, date, mealTime });
    if (!meal) {
      meal = await Meal.create({
        user,
        date: date || new Date(),
        mealTime: mealTime || 'breakfast',
        foods: foods.map(f => f._id)
      });
      createdMeals++;
    } else {
      // Add foods to existing meal if not already present
      const newFoods = foods.map(f => f._id).filter(id => !meal.foods.includes(id));
      if (newFoods.length > 0) {
        meal.foods.push(...newFoods);
        await meal.save();
      }
    }
    // Update foods with meal reference
    await Food.updateMany({ _id: { $in: foods.map(f => f._id) } }, { $set: { meal: meal._id } });
    // Add meal to user's meals array if not already present
    await User.updateOne({ _id: user }, { $addToSet: { meals: meal._id } });
  }
  console.log(`Created or updated ${Object.keys(grouped).length} meals for orphaned foods.`);

  // 3. Clean up orphaned meals (meals with no foods)
  const orphanedMeals = await Meal.deleteMany({ $or: [ { foods: { $exists: false } }, { foods: { $size: 0 } } ] });
  console.log(`Deleted ${orphanedMeals.deletedCount} orphaned meals.`);

  // 4. Clean up orphaned posts (posts with no meal)
  const orphanedPosts = await Post.deleteMany({ $or: [ { meal: { $exists: false } }, { meal: null } ] });
  console.log(`Deleted ${orphanedPosts.deletedCount} orphaned posts.`);

  // 5. Add indexes for performance
  await Meal.collection.createIndex({ user: 1, date: 1, mealTime: 1 });
  await Food.collection.createIndex({ user: 1, date: 1, mealTime: 1 });

  // 6. Print migration report
  const userCount = await User.countDocuments();
  const foodCount = await Food.countDocuments();
  const mealCount = await Meal.countDocuments();
  const postCount = await Post.countDocuments();
  console.log('--- Migration Report ---');
  console.log(`Users: ${userCount}`);
  console.log(`Foods: ${foodCount}`);
  console.log(`Meals: ${mealCount}`);
  console.log(`Posts: ${postCount}`);

  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 