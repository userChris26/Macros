// seed-macros.js
require('dotenv').config();
const mongoose = require('mongoose');
const faker = require('faker');

const User = require('./models/user');
const Food = require('./models/Food');
const Meal = require('./models/Meal');
const Post = require('./models/Post');
const Network = require('./models/Network');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const mealTimes = ['breakfast', 'lunch', 'dinner', 'snack'];
const days = [0, 1]; // today and yesterday

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  var blake2 = require('blake2');
  var hash = blake2.createHash('blake2b');

  // 1. Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Food.deleteMany({}),
    Meal.deleteMany({}),
    Post.deleteMany({}),
    Network.deleteMany({})
  ]);
  console.log('Cleared all collections.');

  // 2. Seed users with bios
  const users = [];
  hash.update('password123')
  for (let i = 0; i < 5; i++) {
    users.push(await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: `user${i + 1}@test.com`,
      password: hash.digest('hex'),
      profilePic: '',
      bio: faker.lorem.sentence()
    }));
  }
  console.log('Seeded users:', users.map(u => u.email));

  // 3. Seed foods and meals for each user for two days and each meal time
  const allMeals = [];
  for (const user of users) {
    for (const day of days) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      for (const mealTime of mealTimes) {
        // Create foods for this meal
        const foods = [];
        for (let f = 0; f < 2; f++) {
          foods.push(await Food.create({
            user: user._id,
            foodName: faker.commerce.productName(),
            calories: faker.datatype.number({ min: 50, max: 700 }),
            protein: faker.datatype.number({ min: 1, max: 50 }),
            carbs: faker.datatype.number({ min: 1, max: 100 }),
            fats: faker.datatype.number({ min: 0, max: 40 }),
            portionSize: `${faker.datatype.number({ min: 1, max: 3 })} serving(s)`,
            mealTime,
            date
          }));
        }
        // Create meal and link foods
        const meal = await Meal.create({
          user: user._id,
          mealTime,
          date,
          foods: foods.map(f => f._id)
        });
        // Update foods with meal reference
        await Food.updateMany({ _id: { $in: foods.map(f => f._id) } }, { $set: { meal: meal._id } });
        // Add meal to user's meals array
        await User.updateOne({ _id: user._id }, { $addToSet: { meals: meal._id } });
        allMeals.push(meal);
      }
    }
  }
  console.log('Seeded foods and meals.');

  // 4. Create posts for some meals
  for (let i = 0; i < allMeals.length; i += 3) {
    const meal = allMeals[i];
    await Post.create({
      user: meal.user,
      meal: meal._id,
      description: faker.lorem.sentence(),
      image_url: '',
      date: meal.date
    });
  }
  console.log('Seeded posts.');

  // 5. Create random network connections
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        await Network.create({
          followerId: users[i]._id,
          followingId: users[j]._id
        });
      }
    }
  }
  console.log('Seeded network connections.');

  // 6. Print summary and test login info
  const userCount = await User.countDocuments();
  const foodCount = await Food.countDocuments();
  const mealCount = await Meal.countDocuments();
  const postCount = await Post.countDocuments();
  const networkCount = await Network.countDocuments();
  console.log('--- Seeding Summary ---');
  console.log(`Users: ${userCount}`);
  console.log(`Foods: ${foodCount}`);
  console.log(`Meals: ${mealCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Network connections: ${networkCount}`);
  console.log('Test login: email=user1@test.com password=password123');

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
}); 