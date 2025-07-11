// seed-network.js
require('dotenv').config();
const mongoose = require('mongoose');

async function seedNetwork() {
  let conn;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Ensure we have a MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    // Create a fresh connection
    conn = mongoose.createConnection(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
      
      conn.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      conn.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Define models inline
    const UserSchema = new mongoose.Schema({
      firstName:  { type: String, required: true },
      lastName:   { type: String, required: true },
      email:      { type: String, required: true, unique: true },
      password:   { type: String, required: true },
      profilePic: { type: String },
      bio:        { type: String },
      createdAt:  { type: Date,   default: Date.now }
    });
    
    const NetworkSchema = new mongoose.Schema({
      followerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt:   { type: Date, default: Date.now }
    });
    
    const User = conn.model('User', UserSchema);
    const Network = conn.model('Network', NetworkSchema);
    
    console.log('🌱 Seeding network connections...');
    
    // Clear existing network data
    const deleteResult = await Network.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing network connections`);
    
    // Get all users
    const users = await User.find({});
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users to create network connections. Please seed users first.');
      return;
    }
    
    // Create sample network connections
    const sampleNetworks = [
      // John follows Jane and Mike
      { followerId: users[0]._id, followingId: users[1]._id }, // John -> Jane
      { followerId: users[0]._id, followingId: users[2]._id }, // John -> Mike
      
      // Jane follows John and Sarah
      { followerId: users[1]._id, followingId: users[0]._id }, // Jane -> John
      { followerId: users[1]._id, followingId: users[3]._id }, // Jane -> Sarah
      
      // Mike follows John and Jane
      { followerId: users[2]._id, followingId: users[0]._id }, // Mike -> John
      { followerId: users[2]._id, followingId: users[1]._id }, // Mike -> Jane
      
      // Sarah follows Jane
      { followerId: users[3]._id, followingId: users[1]._id }, // Sarah -> Jane
    ];
    
    // Create network connections
    const networks = await Network.insertMany(sampleNetworks);
    console.log(`✅ Inserted ${networks.length} network connections:`);
    
    for (const network of networks) {
      const follower = users.find(u => u._id.equals(network.followerId));
      const following = users.find(u => u._id.equals(network.followingId));
      console.log(`   - ${follower?.firstName} ${follower?.lastName} follows ${following?.firstName} ${following?.lastName}`);
    }
    
    console.log('🎉 Network seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding network:', error.message);
    console.error('Full error:', error);
  } finally {
    // Always close the connection
    if (conn && conn.readyState === 1) {
      await conn.close();
      console.log('🔒 Database connection closed');
    }
    process.exit(0);
  }
}

seedNetwork(); 