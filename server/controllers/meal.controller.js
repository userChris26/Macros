const Meal = require('../models/Meal.js');
const FoodEntry = require('../models/FoodEntry.js');
const { cloudinary } = require('../config/cloudinary.js');

// Add or update meal photo
exports.uploadMealPhoto = async (req, res) =>
{
    const { userId, date, mealType, photoBase64 } = req.body;

    if (!userId || !date || !mealType || !photoBase64) {
        return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
        });
    }

    try {
        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(photoBase64, {
            folder: 'meal_photos',
            transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        // Find or create meal
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(mealDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let meal = await Meal.findOne({
            user: userId,
            date: {
            $gte: mealDate,
            $lt: nextDay
            },
            mealTime: mealType
        });

        if (!meal) {
            meal = new Meal({
            user: userId,
            date: mealDate,
            mealTime: mealType,
            foods: []
            });
        }

        // If meal already had a photo, delete old one from Cloudinary
        if (meal.photo && meal.photo.publicId) {
            await cloudinary.uploader.destroy(meal.photo.publicId);
        }

        meal.photo = {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id
        };

        await meal.save();

        res.status(200).json({
            success: true,
            meal
        });

    } catch (error) {
        console.error('Error handling meal photo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to handle meal photo'
        });
    }
}

// Delete meal photo
exports.deleteMealPhoto = async (req, res) =>
{
    const { userId, date, mealType } = req.body;

    if (!userId || !date || !mealType) {
        return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
        });
    }

    try {
        const mealDate = new Date(date);
        const meal = await Meal.findOne({
            user: userId,
            date: {
            $gte: new Date(mealDate.setHours(0, 0, 0)),
            $lt: new Date(mealDate.setHours(23, 59, 59))
            },
            mealTime: mealType
        });

        if (!meal) {
            return res.status(404).json({
            success: false,
            error: 'Meal not found'
            });
        }

        if (meal.photo && meal.photo.publicId) {
            await cloudinary.uploader.destroy(meal.photo.publicId);
            meal.photo = undefined;
            await meal.save();
        }

        res.status(200).json({
            success: true,
            meal
        });
    } catch (error) {
        console.error('Error deleting meal photo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete meal photo'
        });
    }
}

// Get meal details including photo
exports.getMealDetails = async (req, res) =>
{
    const { userId, date, mealType } = req.params;

    if (!userId || !date || !mealType) {
        return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
        });
    }

    try {
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(mealDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const meal = await Meal.findOne({
            user: userId,
            date: {
            $gte: mealDate,
            $lt: nextDay
            },
            mealTime: mealType
        }).populate({
            path: 'foods',
            model: 'FoodEntry'
        });

        if (meal) {
            console.log('Found meal:', {
            mealId: meal._id,
            mealTime: meal.mealTime,
            foodCount: meal.foods.length,
            foods: meal.foods.map(food => ({
                id: food._id,
                description: food.description,
                servingAmount: food.servingAmount,
                nutrients: food.nutrients
            }))
            });
        }

        res.status(200).json({
            success: true,
            meal
        });

    } catch (error) {
        console.error('Error fetching meal:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch meal'
        });
    }
}

// Add meal route
exports.addMeal = async (req, res) => 
{
    console.log('=== ADD MEAL ROUTE CALLED ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, mealName, mealType, foodItems, date } = req.body;
    
    if (!userId || !mealName || !mealType || !foodItems || foodItems.length === 0) {
        console.log('ADD MEAL ERROR: Missing required fields');
        return res.status(400).json({ 
            error: 'userId, mealName, mealType, and foodItems are required',
            // received: { userId, mealName, mealType, foodItems }
        });
    }

    console.log('Parsed fields:', { userId, mealName, mealType, foodItems, date });
    
    try {
        // Validation
        // if (!userId || !mealName || !foodItems || foodItems.length === 0) {
        //     return res.status(400).json({ 
        //         error: 'userId, mealName, and foodItems are required',
        //         received: { userId, mealName, foodItems }
        //     });
        // }

        // Calculate total nutrition for the meal
        let totalNutrients = {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        };
        
        foodItems.forEach(item => {
            if (item.nutrients) {
                totalNutrients.calories += parseFloat(item.nutrients.calories) || 0;
                totalNutrients.protein += parseFloat(item.nutrients.protein) || 0;
                totalNutrients.carbohydrates += parseFloat(item.nutrients.carbohydrates) || 0;
                totalNutrients.fat += parseFloat(item.nutrients.fat) || 0;
                totalNutrients.fiber += parseFloat(item.nutrients.fiber) || 0;
                totalNutrients.sugar += parseFloat(item.nutrients.sugar) || 0;
                totalNutrients.sodium += parseFloat(item.nutrients.sodium) || 0;
            }
        });
        
        // Round to 1 decimal place
        Object.keys(totalNutrients).forEach(key => {
            totalNutrients[key] = totalNutrients[key].toFixed(1);
        });
        
        // Create new meal using Mongoose model
        const newMeal = new Meal({
            user: userId,
            mealName: mealName,
            mealTime: mealType || 'custom', // breakfast, lunch, dinner, snack, custom
            foods: foodItems.map(item => ({
                fdcId: item.fdcId,
                foodName: item.foodName,
                brandOwner: item.brandOwner || '',
                servingSize: item.servingSize,
                servingSizeUnit: item.servingSizeUnit || 'g',
                nutrients: item.nutrients
            })),
            totalNutrients: totalNutrients,
            date: date ? new Date(date) : new Date(),
            isTemplate: true // Mark as reusable template
        });
        
        console.log('New meal to insert:', JSON.stringify(newMeal, null, 2));
        
        const result = await newMeal.save();
        console.log('Meal added successfully:', result._id);
        
        res.json({
            success: true,
            message: 'Meal has been created successfully',
            mealId: result._id,
            meal: result
        });
        
    } catch (error) {
        console.error('ADD MEAL ERROR:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to add meal',
            details: error.message
        });
    }
}

// Get user's meal templates
exports.getUserMealTemplates = async (req, res) =>
{
    console.log('=== GET MEALS ROUTE CALLED ===');
    const { userId, date } = req.body;
    
    console.log('Get meals request:', { userId, date });
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const query = { 
            user: userId,
            isTemplate: true // Only get meal templates
        };
        
        // If date is provided, filter by date
        if (date) {
            const mealDate = new Date(date);
            mealDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(mealDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.date = {
                $gte: mealDate,
                $lt: nextDay
            };
        }
        
        const userMeals = await Meal.find(query).sort({ createdAt: -1 });
        console.log('Found', userMeals.length, 'meal templates for user', userId);
        
        // Transform to match Flutter app expectations
        const transformedMeals = userMeals.map(meal => ({
            _id: meal._id,
            mealName: meal.mealName,
            mealType: meal.mealTime,
            foodItems: meal.foods,
            totalNutrients: meal.totalNutrients,
            dateCreated: meal.date.toISOString().split('T')[0]
        }));
        
        res.json({
            success: true,
            meals: transformedMeals
        });
    } catch (error) {
        console.error('Get meals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Add meal template to daily log
exports.addMealTemplateToday = async (req, res) =>
{
    console.log('=== ADD MEAL TO TODAY ROUTE CALLED ===');
    const { userId, mealId, date } = req.body;
    
    console.log('Add meal to today request:', { userId, mealId, date });
    
    if (!userId || !mealId) {
        return res.status(400).json({ error: 'User ID and Meal ID are required' });
    }

    try {
        // Get the meal template
        const mealTemplate = await Meal.findOne({ 
            _id: mealId,
            user: userId,
            isTemplate: true
        });
        
        if (!mealTemplate) {
            return res.status(404).json({ error: 'Meal template not found' });
        }
        
        // Add each food item from the meal to today's food entries
        const today = date || new Date().toISOString().split('T')[0];
        const addedEntries = [];
        
        for (const foodItem of mealTemplate.foods) {
            const newFoodEntry = new FoodEntry({
                userId: userId,
                fdcId: foodItem.fdcId,
                foodName: foodItem.foodName,
                brandOwner: foodItem.brandOwner || '',
                servingSize: foodItem.servingSize,
                servingSizeUnit: foodItem.servingSizeUnit || 'g',
                mealType: mealTemplate.mealTime,
                nutrients: foodItem.nutrients,
                dateAdded: today,
                timestamp: new Date().toISOString(),
                mealName: mealTemplate.mealName // Track which meal this came from
            });
            
            const result = await newFoodEntry.save();
            addedEntries.push(result);
        }
        
        console.log('Added', addedEntries.length, 'food entries from meal', mealTemplate.mealName);
        
        res.json({
            success: true,
            message: `Added ${mealTemplate.mealName} to today's log`,
            addedEntries: addedEntries
        });
        
    } catch (error) {
        console.error('Add meal to today error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Delete meal template
exports.deleteMealTemplate = async (req, res) =>
{
    console.log('=== DELETE MEAL ROUTE CALLED ===');
    const { userId, mealId } = req.body;
    
    console.log('Delete meal request:', { userId, mealId });

    if (!userId || !mealId) {
        return res.status(400).json({ error: 'User ID and Meal ID are required' });
    }

    try {
        const result = await Meal.findOne({
            _id: mealId,
            user: userId, // Security check - only delete user's own meals
            isTemplate: true
        });
        
        
        if (!result) {
            res.status(404).json({ error: 'Meal not found' });
        }

        await Meal.deleteOne({ 
            _id: mealId,
            user: userId, // Security check - only delete user's own meals
            isTemplate: true
        });

        console.log('Meal deleted successfully:', mealId);
            res.json({
                success: true,
                message: 'Meal deleted'
            });

    } catch (error) {
        console.error('Delete meal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Update meal template
exports.updateMealTemplate = async (req, res) => 
{
    console.log('=== UPDATE MEAL ROUTE CALLED ===');
    const { mealId } = req.params;
    const { userId, mealName, mealType, foodItems } = req.body;
    
    console.log('Update meal request:', { mealId, userId, mealName, mealType });
    
    if (!userId || !mealName || !foodItems || foodItems.length === 0) {
        return res.status(400).json({ 
            error: 'userId, mealName, and foodItems are required'
        });
    }

    if (!mealId) {
        return res.status(400).json({
            error: "mealId is required"
        })
    }
    try {
        // Calculate total nutrition for the updated meal
        let totalNutrients = {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        };
        
        foodItems.forEach(item => {
            if (item.nutrients) {
                totalNutrients.calories += parseFloat(item.nutrients.calories) || 0;
                totalNutrients.protein += parseFloat(item.nutrients.protein) || 0;
                totalNutrients.carbohydrates += parseFloat(item.nutrients.carbohydrates) || 0;
                totalNutrients.fat += parseFloat(item.nutrients.fat) || 0;
                totalNutrients.fiber += parseFloat(item.nutrients.fiber) || 0;
                totalNutrients.sugar += parseFloat(item.nutrients.sugar) || 0;
                totalNutrients.sodium += parseFloat(item.nutrients.sodium) || 0;
            }
        });
        
        // Round to 1 decimal place
        Object.keys(totalNutrients).forEach(key => {
            totalNutrients[key] = totalNutrients[key].toFixed(1);
        });

        const updatedMeal = await Meal.findOneAndUpdate(
            { 
                _id: mealId,
                user: userId,
                isTemplate: true
            },
            {
                mealName,
                mealTime: mealType,
                foods: foodItems.map(item => ({
                    fdcId: item.fdcId,
                    foodName: item.foodName,
                    brandOwner: item.brandOwner || '',
                    servingSize: item.servingSize,
                    servingSizeUnit: item.servingSizeUnit || 'g',
                    nutrients: item.nutrients
                })),
                totalNutrients
            },
            { new: true }
        );

        if (!updatedMeal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        console.log('Meal updated successfully:', mealId);
        
        res.json({
            success: true,
            message: 'Meal updated successfully',
            meal: updatedMeal
        });
        
    } catch (error) {
        console.error('Update meal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Get meal template details
exports.getMealTemplate = async (req, res) =>
{
    console.log('=== GET MEAL DETAILS ROUTE CALLED ===');
    const { mealId } = req.params;
    const { userId } = req.query;
    
    console.log('Get meal details request:', { mealId, userId });
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!mealId) {
        return res.status(400).json({ error: 'Meal ID is required' });
    }

    try {
        const meal = await Meal.findOne({
            _id: mealId,
            user: userId,
            isTemplate: true
        });

        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        // Transform to match Flutter app expectations
        const transformedMeal = {
            _id: meal._id,
            mealName: meal.mealName,
            mealType: meal.mealTime,
            foodItems: meal.foods,
            totalNutrients: meal.totalNutrients,
            dateCreated: meal.date.toISOString().split('T')[0]
        };

        res.json({
            success: true,
            meal: transformedMeal
        });
        
    } catch (error) {
        console.error('Get meal details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}