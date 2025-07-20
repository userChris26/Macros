const Network = require('../models/Network.js');
const FoodEntry = require('../models/FoodEntry.js');

// Follow a user
exports.followUser = async (req, res) => 
{    
    try
    { 
        const { followerId, followingId } = req.body;
        const existing = await Network.findOne({ followerId, followingId });
        
        if (existing)
        {
            return res.json({ error: 'Already following this user' })
        }
        
        if (followerId === followingId)
        {
            return res.json({error: 'Cannot follow yourself'});
        }

        await Network.create({ followerId, followingId });
        
        res.status(200).json({ error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not follow user' });
    }
}

// Unfollow a user
exports.unfollowUser = async (req, res) =>
{
    try
    {
        const { followerId, followingId } = req.body;
        const existing = await Network.findOne({ followerId, followingId });
        
        if (!existing)
        {
            return res.json({ error: 'Not following this user' });
        }
        
        // Check if trying to unfollow self
        if (followerId === followingId)
        {
            return res.json({ error: 'Cannot unfollow yourself' });
        }

        await Network.findOneAndDelete({ followerId, followingId });
        
        res.json({ error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not unfollow user' });
    }
}

// Get followers for a user
exports.getFollowers = async (req, res) =>
{
    try
    {
        const followers = await Network.find({ followingId: req.params.userId })
                                    .populate('followerId', 'firstName lastName email profilePic')
                                    .sort({ createdAt: -1 });
        res.json({ followers, error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch followers' });
    }
}

// Get users being followed by a user
exports.getFollowing = async (req, res) => 
{
    try
    {
        const following = await Network.find({ followerId: req.params.userId })
                                    .populate('followingId', 'firstName lastName email profilePic')
                                    .sort({ createdAt: -1 });
        res.json({ following, error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch following' });
    }
}

 // Get dashboard stats
exports.getDashboardStats = async (req, res) =>
{
    try
    {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // Get today's food entries
        const foodEntries = await FoodEntry.find({
            userId,
            dateAdded: today
        });

        // Calculate total calories
        const totalCalories = foodEntries.reduce((acc, entry) => 
            acc + parseFloat(entry.nutrients.calories || '0'), 0
        );

        // Get user's social stats
        const followingCount = await Network.countDocuments({ followerId: userId });
        const followersCount = await Network.countDocuments({ followingId: userId });

        res.json({
        success: true,
        stats: {
            totalCalories,
            totalEntries: foodEntries.length,
            following: followingCount,
            followers: followersCount
        }
        });
    }
    catch (err)
    {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}