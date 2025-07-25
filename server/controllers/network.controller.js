const Network = require('../models/Network.js');
const FoodEntry = require('../models/FoodEntry.js');

// Follow a user
exports.followUser = async (req, res, next) => 
{    
    const { followerId, followingId } = req.body;

    if(!followerId || !followingId)
    {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try
    { 
        if (followerId === followingId)
        {
            return res.json({error: 'Cannot follow yourself'});
        }

        const existing = await Network.findOne({ followerId, followingId });
        
        if (existing)
        {
            return res.json({ error: 'Already following this user' })
        }

        await Network.create({ followerId, followingId });
        
        res.status(200).json({ error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not follow user' });
    }

    next();
}

// Unfollow a user
exports.unfollowUser = async (req, res, next) =>
{
    try
    {
        const { followerId, followingId } = req.body;
        if (!followerId || !followingId)
        {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if trying to unfollow self
        if (followerId === followingId)
        {
            return res.json({ error: 'Cannot unfollow yourself' });
        }

        const existing = await Network.findOne({ followerId, followingId });
        
        if (!existing)
        {
            return res.json({ error: 'Not following this user' });
        }
        
        

        await Network.findOneAndDelete({ followerId, followingId });
        
        res.json({ error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not unfollow user' });
    }

    next();
}

// Get followers for a user
exports.getFollowers = async (req, res, next) =>
{
    const { userId } = req.params;
    if (!userId)
    {
        return res.status(400).json({ error: "userId not provided" });
    }
    try
    {
        const followers = await Network.find({ followingId: userId })
                                    .populate('followerId', 'firstName lastName email profilePic')
                                    .sort({ createdAt: -1 });
        res.json({ followers, error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch followers' });
    }

    next();
}

// Get users being followed by a user
exports.getFollowing = async (req, res, next) => 
{
    const { userId } = req.params;
    if (!userId)
    {
        return res.status(400).json({ error: "userId not provided" });
    }

    try
    {
        const following = await Network.find({ followerId: userId })
                                    .populate('followingId', 'firstName lastName email profilePic')
                                    .sort({ createdAt: -1 });
        res.json({ following, error: '' });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch following' });
    }

    next();
}

 // Get dashboard stats
exports.getDashboardStats = async (req, res, next) =>
{
    try
    {
        const { userId } = req.params;

        if (!userId)
        {
            return res.status(400).json({ error: "userId not provided" });
        }

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

    next();
}