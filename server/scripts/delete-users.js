require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const FoodEntry = require('../models/FoodEntry');
const Meal = require('../models/Meal');
const Network = require('../models/Network');
const { cloudinary } = require('../config/cloudinary');

const usersToDelete = [
    'mcreynolds02@gmail.com',
    'ma081111@ucf.edu'
];

async function deleteUsers() {
    try {
        // Connect to MongoDB
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find users
        const users = await User.find({ email: { $in: usersToDelete } });
        
        if (users.length === 0) {
            console.log('❌ No matching users found');
            process.exit(0);
        }

        console.log(`Found ${users.length} users to delete:`);
        users.forEach(user => console.log(`- ${user.email}`));

        // Delete each user and their data
        for (const user of users) {
            console.log(`\nDeleting user ${user.email}...`);
            
            try {
                // Delete all associated data
                await Promise.all([
                    // Delete user's food entries
                    FoodEntry.deleteMany({ user: user._id }).then(result => 
                        console.log(`✅ Deleted ${result.deletedCount} food entries`)),
                    
                    // Delete user's meals
                    Meal.deleteMany({ user: user._id }).then(result => 
                        console.log(`✅ Deleted ${result.deletedCount} meals`)),
                    
                    // Delete network connections
                    Network.deleteMany({ 
                        $or: [{ followerId: user._id }, { followingId: user._id }] 
                    }).then(result => 
                        console.log(`✅ Deleted ${result.deletedCount} network connections`)),
                    
                    // Delete profile picture if exists
                    user.profilePic ? 
                        cloudinary.uploader.destroy(`profile_pictures/${user.profilePic.split('/').pop().split('.')[0]}`)
                            .then(() => console.log('✅ Deleted profile picture'))
                            .catch(err => console.log('⚠️ No profile picture found or error deleting it')) : 
                        Promise.resolve(),
                    
                    // Delete the user
                    User.findByIdAndDelete(user._id).then(() => 
                        console.log('✅ Deleted user account'))
                ]);

                console.log(`✅ Successfully deleted all data for ${user.email}`);
            } catch (err) {
                console.error(`❌ Error deleting user ${user.email}:`, err);
            }
        }

        console.log('\n✅ Deletion process completed');
    } catch (err) {
        console.error('❌ Script error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the script
deleteUsers(); 