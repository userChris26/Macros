const searchUSDA = require('../scripts/searchUSDA.js');
const FoodEntry = require('../models/FoodEntry.js');
const Meal = require('../models/Meal.js');

exports.getFoodEntries =  async (req, res) => 
{
    console.log('=== GET FOOD ENTRIES ROUTE CALLED ===');
    const { userId, date } = req.body;
    
    console.log('Get food entries request:', { userId, date });
    
    if (!userId)
    {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try
    {
        const query = { userId: userId };  // No need to parseInt since we store it as string
        
        // If date is provided, filter by date
        if (date)
        {
            query.dateAdded = date;
        }
        
        const entries = await FoodEntry.find(query);
        console.log('Found', entries.length, 'food entries for user', userId, 'on date', date);

        // Get meal photos for each entry's meal type
        const mealDate = new Date(date);
        mealDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(mealDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const meals = await Meal.find({
            user: userId,
            date: {
                $gte: mealDate,
                $lt: nextDay
            }
        });

        // Create a map of mealType -> photo
        const mealPhotoMap = meals.reduce((acc, meal) => {
            if (meal.photo) {
                acc[meal.mealTime] = meal.photo;
            }
            return acc;
        }, {});

        // Add photo to each entry
        const entriesWithPhotos = entries.map(entry => ({
            ...entry.toObject(),
            mealPhoto: mealPhotoMap[entry.mealType] || null
        }));
        
        // Calculate total calories
        let totalCalories = 0;
        entries.forEach(entry => {
            if (entry.nutrients && entry.nutrients.calories) {
                totalCalories += parseFloat(entry.nutrients.calories) || 0;
            }
        });
        
        res.json({
            success: true,
            foodEntries: entriesWithPhotos,
            totalCalories: totalCalories.toFixed(1)
        });
    }
    catch (error)
    {
        console.error('Get food entries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.deleteFoodEntry = async (req, res) =>
{
    console.log('=== DELETE FOOD ENTRY ROUTE CALLED ===');
    const { userId, entryId } = req.body;

    if (!userId)
    {
        return res.status(400).json({ error: "User ID is required" });
    }
    
    console.log('Delete food entry request:', { userId, entryId });
    
    if (!entryId) {
        return res.status(400).json({ error: 'Entry ID is required' });
    }

    try {
        const result = await FoodEntry.findOne({
            _id: entryId,
            userId: userId
        })

        if (!result) {
            return res.status(404).json({ error: 'Food entry not found'});
        }

        await FoodEntry.deleteOne({ 
            _id: entryId,
            userId: userId // Also check userId for security
        });

        console.log('Food entry deleted successfully:', entryId);
        res.status(200).json({
            success: true,
            message: 'Food entry deleted',
            error: ''
        });

    } catch (error) {
        console.error('Delete food entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.getFoodDetails = async (req, res) =>
{
    const { fdcId } = req.params;

    if (!fdcId)
    {
        return res.status(400).json({ error: "FDC ID is required" });
    }
    
    try
    {
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&nutrients=203,204,205,208`;
        const response = await fetch(url);
        
        if (!response.ok)
        {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const data = await response.json();

        // Get portion info
        const portion = data.foodPortions?.[0] || { gramWeight: 100 };
        const servingsPerHundredGrams = Math.round(100 / portion.gramWeight);

        // Extract the nutrients we want
        const nutrients = {};
        data.foodNutrients?.forEach(nutrient => {
            switch (nutrient.nutrient?.id)
            {
                case 1008: // Energy
                    nutrients.calories = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1003: // Protein
                    nutrients.protein = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1004: // Total lipid (fat)
                    nutrients.fat = nutrient.amount / servingsPerHundredGrams;
                    break;
                case 1005: // Carbohydrate
                    nutrients.carbohydrates = nutrient.amount / servingsPerHundredGrams;
                    break;
            }
        });

        // Format the response
        const result = {
            fdcId: data.fdcId,
            description: data.description,
            dataType: data.dataType,
            nutrients,
            portion: {
                gramWeight: portion.gramWeight,
                servingsPerHundredGrams,
                modifier: portion.modifier,
                measureUnit: portion.measureUnit?.name
            }
        };

        res.json({
            success: true,
            food: result
        });
    }
    catch (error)
    {
        console.error('Error fetching food details:', error);
        res.status(500).json({ 
            error: 'Failed to fetch food details',
            details: error.message 
        });
    }
}

exports.searchFood = async (req, res) =>
{
    const { query } = req.query;
    
    if (!query)
    {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try
    {
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=25`;
        const response = await fetch(url);
        
        if (!response.ok)
        {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the response to include brand info for branded foods
        const foods = data.foods?.map(food => {
            const result = {
                fdcId: food.fdcId,
                description: food.description,
                dataType: food.dataType
            };

            // Add brand info if it's a branded food
            if (food.dataType === 'Branded')
            {
                result.brandOwner = food.brandOwner;
                result.brandName = food.brandName;
            }

            return result;
        }) || [];

        res.json({
            success: true,
            foods: foods
        });
    }
    catch (error)
    {
        console.error('Error searching foods:', error);
        res.status(500).json({ 
            error: 'Failed to search foods',
            details: error.message 
        });
    }
}

exports.addFood = async (req, res) =>
{
    const { userId, fdcId, servingAmount, mealType, date } = req.body;

    // Validate required fields
    if (!userId || !fdcId || !servingAmount || !mealType)
    {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            required: ['userId', 'fdcId', 'servingAmount', 'mealType']
        });
    }

    try
    {
        // First get the food details from USDA
        const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
        const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&nutrients=203,204,205,208`;
        const response = await fetch(url);
        
        if (!response.ok)
        {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const foodData = await response.json();

        // Get portion info
        const portion = foodData.foodPortions?.[0] || { gramWeight: 100, measureUnit: { name: 'serving' } };

        // Calculate conversion factor from 100g to total amount (per serving * number of servings)
        const conversionFactor = (portion.gramWeight / 100) * servingAmount;

        // Extract nutrients (USDA API returns values per 100g, we convert to total amount)
        const nutrients = {};
        foodData.foodNutrients?.forEach(nutrient => {
            switch (nutrient.nutrient?.id) {
                case 1008: // Energy
                    nutrients.calories = nutrient.amount * conversionFactor;
                    break;
                case 1003: // Protein
                    nutrients.protein = nutrient.amount * conversionFactor;
                    break;
                case 1004: // Total lipid (fat)
                    nutrients.fat = nutrient.amount * conversionFactor;
                    break;
                case 1005: // Carbohydrate
                    nutrients.carbohydrates = nutrient.amount * conversionFactor;
                    break;
            }
        });

        // Create the food entry
        const foodEntry = new FoodEntry({
            userId,
            fdcId,
            description: foodData.description,
            dataType: foodData.dataType,
            // Add brand info if it's a branded food
            ...(foodData.dataType === 'Branded' && {
                brandOwner: foodData.brandOwner,
                brandName: foodData.brandName
            }),
            servingAmount,
            servingUnit: portion.measureUnit?.name || 'serving',
            gramWeight: portion.gramWeight,
            nutrients,
            mealType,
            date: date ? new Date(date) : new Date()
        });

        // Save the food entry
        const savedFoodEntry = await foodEntry.save();

        // Find or create the meal for this entry
        const entryDate = foodEntry.date;
        entryDate.setHours(0, 0, 0, 0); // Set to start of day
        const nextDay = new Date(entryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let meal = await Meal.findOne({
            user: userId,
            date: {
                $gte: entryDate,
                $lt: nextDay
            },
            mealTime: mealType
        });

        if (!meal)
        {
            // Create new meal if it doesn't exist
            meal = new Meal({
                user: userId,
                date: entryDate,
                mealTime: mealType,
                foods: [savedFoodEntry._id]
            });
        }
        else
        {
            // Add food entry to existing meal
            meal.foods.push(savedFoodEntry._id);
        }

        await meal.save();

        res.json({
            success: true,
            message: 'Food entry added successfully',
            entry: savedFoodEntry,
            meal: meal
        });
        console.log('Food entry added successfully:', savedFoodEntry);

    }
    catch (error)
    {
        console.error('Error adding food entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add food entry',
            details: error.message
        });
    }
}

exports.testUSDA = async (req, res) => 
{
    try
    {
        console.log('Testing USDA API...');
        const foods = await searchUSDA.searchUSDAFood('apple');
        res.json({ 
            success: true, 
            count: foods.length, 
            foods: foods.slice(0, 3),
            message: 'USDA API is working!'
        });
    }
    catch (error)
    {
        console.error('USDA API test failed:', error);
        res.json({ 
            success: false, 
            error: error.message,
            message: 'USDA API test failed'
        });
    }
}