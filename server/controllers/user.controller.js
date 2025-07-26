const { cloudinary, upload } = require('../config/cloudinary.js');
const User = require('../models/User.js');
const Meal = require('../models/Meal.js');
const Network = require('../models/Network.js');
const FoodEntry = require('../models/FoodEntry.js');

exports.searchUser = async (req, res, next) =>
{
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        // Search by first name, last name, or email
        const users = await User.find({
            $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
            ]
        })
        .select('firstName lastName email profilePic')
        .limit(10);

        // Transform the response to match our standardized format
        const transformedUsers = users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePic: user.profilePic || null
        }));

        res.status(200).json({ users: transformedUsers, error: '' });
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ error: 'Failed to search users' });
    }

    next();
}

exports.uploadProfilePic = async (req, res, next) =>
{
    try {
        const { userId } = req.params;
        const { path } = req.file;

        if (!userId) {
            return res.status(400).json({ error: "No userId provided" });
        }

        if (!path) {
            return res.status(400).json({ error: 'No photo data provided' });
        }

        let updatedUser = await User.findById(userId);

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user's profile picture URL in database
        updatedUser = await User.findOneAndUpdate(
            { _id: userId},
            { $set: {profilePic: path} },
            { new: true }
        );

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicUrl: path,
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic
            },
            error: ''
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }

    next();
}

// Delete profile picture
exports.deleteProfilePic =  async (req, res, next) =>
{
    try {
        const { userId } = req.params;

        if (!userId)
        {
            return res.status(400).json({ error: "userId not provided" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete from Cloudinary if exists
        if (user.profilePic) {
            const publicId = user.profilePic.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        }

        // Update user in database
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: {profilePic: null} },
            { new: true }
        );

        res.status(200).json({
            message: 'Profile picture deleted successfully',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic
            },
            error: ''
        });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete profile picture' });
    }

    next();
}

// Get user profile (including profile picture)
exports.getUser = async (req, res, next) => 
{
    const { userId } = req.params;

    if (!userId)
    {
        return res.status(400).json({ error: "userId not provided" });
    }
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePic: user.profilePic,
                bio: user.bio,
                createdAt: user.createdAt
            },
            error: ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch user profile' });
    }

    next();
}

// Update user profile
exports.updateUser = async (req, res, next) => 
{
    const { userId } = req.params;
    if (!userId)
    {
        return res.status(400).json({error: "userId not provided"});
    }
    
    const { firstName, lastName, bio } = req.body;
    if (!firstName || !lastName)
    {
        return res.status(400).json({error: "User details not provided"});
    }

    try {

        // const updatedUser = await User.findByIdAndUpdate(
        //     userId,
        //     { firstName, lastName, bio },
        //     { new: true }
        // );
        const updatedUser = await User.findById(userId).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.findOneAndUpdate(
            { _id: userId },
            { $set: {firstName, lastName, bio} },
            { new: true }
        );

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic,
                bio: updatedUser.bio
            },
            error: ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not update profile' });
    }

    next();
}

exports.deleteUser = async (req, res, next) =>
{
    try {
        const { userId } = req.params;
        if (!userId)
        {
            return res.status(400).json({error: "userId not provided"});
        }

        // Find user first to check if exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete all associated data
        await Promise.all([
            // Delete user's food entries
            FoodEntry.deleteMany({ user: userId }),
            // Delete user's meals
            Meal.deleteMany({ user: userId }),
            // Delete network connections (both following and followers)
            Network.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }),
            // Delete the user's profile picture from Cloudinary if it exists
            user.profilePic ? cloudinary.uploader.destroy(`profile_pictures/${user.profilePic.split('/').pop().split('.')[0]}`) : Promise.resolve(),
            // Finally delete the user
            User.findByIdAndDelete(userId)
        ]);

        res.status(200).json({
                    error: '', 
                    message: 'User and associated data deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }

    next();
}