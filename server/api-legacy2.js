require('express');
require('mongodb');

// USDA Food API search function
async function searchUSDAFood(query) {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  console.log('Searching USDA API for:', query);
  console.log('Using API key:', apiKey ? 'API key loaded' : 'No API key');
  
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=25`;
    console.log('USDA API URL:', url);
    
    const response = await fetch(url);
    console.log('USDA API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('USDA API response received, foods count:', data.foods ? data.foods.length : 0);
    
    return data.foods || [];
  } catch (error) {
    console.error('Error searching USDA API:', error);
    throw error;
  }
}

exports.setApp = function ( app, client )
{
    const User = require("./models/user.js");
    const Card = require("./models/card.js");
    const FoodEntry = require("./models/foodEntry.js");  // Add this line

    app.post('/api/register', async (req, res, next) =>
    {
        // incoming: userLogin, userPassword, userEmail, userFirstName, userLastName
        // outgoing: error

        const { userFirstName, userLastName, userEmail, userLogin, userPassword } = req.body;
        var error = '';
        
        const results = await User.find({ $or: [{login: userLogin}, {email: userEmail}] });
        try
        {
            if ( results.length > 0 )
            {
                error = "Account Already Exists";
            }
            else
            {
                const newUser = new User({ email: userEmail, 
                    login: userLogin, password: userPassword,
                    firstName: userFirstName, lastName: userLastName });
                await newUser.save();
            }
        }
        catch(e)
        {
            error = e.toString();
        }

        var ret = { error: error };
        res.status(200).json(ret);
    });

    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: userLogin, userPassword
        // outgoing: id, firstName, lastName, error

        var error = '';

        const { userLogin, userPassword } = req.body;

        //const db = client.db('COP4331Cards');

        const results = await User.find({login: userLogin, password: userPassword});

        var userId = -1;
        var userFirstName = '';
        var userLastName = '';

        var ret;

        if( results.length > 0 )
        {
            userId = results[0]._id;
            userFirstName = results[0].firstName;
            userLastName = results[0].lastName;

            try
            {
                const token = require("./createJWT.js");
                ret = token.createToken( userFirstName, userLastName, userId );
            }
            catch(e)
            {
                ret = {error:e.message};
            }
        }
        else
        {
            ret = {error:"Login/Password incorrect"};
        }
        
        res.status(200).json(ret);
    });

    app.post('/api/updateaccount', async (req, res, next) =>
    {
        // incoming: userId, userFirstName, userLastName, userEmail, userLogin, userJwt
        // outgoing: error

        var token = require('./createJWT.js');
        
        const { userId, userFirstName, userLastName, userEmail, userLogin, userJwt } = req.body;
        
        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error: 'The JWT is no longer valid', userJwt: ''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }
        
        var error = '';

        try
        {
            result = await User.updateOne(
                {_id:ObjectId.createFromHexString(userId)},
                {
                    $set: {email: userEmail, login: userLogin,
                        firstName: userFirstName, lastName: userLastName}
                }
            );
            
        }
        catch(e)
        {
            error = e.toString();
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, card, userJwt
        // outgoing: error
        
        var token = require('./createJWT.js');

        const { userId, card, userJwt } = req.body;

        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error:'The JWT is no longer valid', userJwt: ''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        const newCard = new Card({user:userId, name:card});
        var error = '';

        try
        {
            await newCard.save();
        }
        catch(e)
        {
            error = e.toString();
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search, userJwt
        // outgoing: results[], error
        
        var error = '';

        var token = require('./createJWT.js');

        const { userId, search, userJwt } = req.body;
        try
        {
            if(token.isExpired(userJwt))
            {
                var ret = {error:'The JWT is no longer valid', userJwt:''};
                res.status(200).json(ret);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var _search = search.trim();

        const results = await Card.find({ "name": {$regex: _search+'.*', $options: 'i'} })
        
        var _ret = [];
        for( var i = 0; i < results.length; i++ )
        {
            _ret.push( results[i].name );
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(userJwt);
        }
        catch(error)
        {
            console.log(error.message);
        }
        
        var ret = { results: _ret, error: error, userJwt: refreshedToken };

        res.status(200).json(ret);
    });

        // Search foods route
    app.post('/api/searchfoods', async (req, res) => {
        console.log('=== SEARCH FOODS ROUTE CALLED ===');
        const { query } = req.body;
        
        console.log('Food search request:', { query });
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        try {
            const foods = await searchUSDAFood(query);
            console.log('Returning', foods.length, 'foods');
            res.json({
                success: true,
                foods: foods
            });
        } catch (error) {
            console.error('Error searching USDA API:', error);
            res.status(500).json({ 
                error: 'Failed to search foods',
                details: error.message 
            });
        }
    });

    // Add food route
    app.post('/api/addfood', async (req, res) => {
        console.log('=== ADD FOOD ROUTE CALLED ===');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        
        try {
            const { userId, fdcId, servingSize, date } = req.body;
            
            console.log('Parsed fields:', { userId, fdcId, servingSize, date });
            
            // Validation
            if (!userId || !fdcId || !servingSize) {
                console.log('ADD FOOD ERROR: Missing required fields');
                return res.status(400).json({ 
                    error: 'userId, fdcId, and servingSize are required',
                    received: { userId, fdcId, servingSize }
                });
            }

            // First, get food details from USDA API
            console.log('Fetching food details from USDA API for fdcId:', fdcId);
            const foodDetailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${process.env.USDA_API_KEY || 'DEMO_KEY'}`;
            const foodResponse = await fetch(foodDetailsUrl);
            
            if (!foodResponse.ok) {
                throw new Error(`Failed to fetch food details: ${foodResponse.status}`);
            }
            
            const foodData = await foodResponse.json();
            console.log('Food data received:', foodData.description);
            
            // Extract nutrition data
            const nutrients = {};
            if (foodData.foodNutrients) {
                foodData.foodNutrients.forEach(nutrient => {
                    const name = nutrient.nutrient?.name?.toLowerCase();
                    if (name) {
                        if (name.includes('energy') || name.includes('calorie')) {
                            nutrients.calories = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('protein')) {
                            nutrients.protein = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('carbohydrate')) {
                            nutrients.carbohydrates = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('fat') && !name.includes('fatty')) {
                            nutrients.fat = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('fiber')) {
                            nutrients.fiber = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('sugar')) {
                            nutrients.sugar = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        } else if (name.includes('sodium')) {
                            nutrients.sodium = ((nutrient.amount || 0) * servingSize / 100).toFixed(1);
                        }
                    }
                });
            }

            const newFoodEntry = new FoodEntry({
                userId: userId,
                fdcId: parseInt(fdcId),
                foodName: foodData.description || 'Unknown Food',
                brandOwner: foodData.brandOwner || '',
                servingSize: parseFloat(servingSize),
                servingSizeUnit: 'g',
                nutrients: {
                    calories: nutrients.calories || '0',
                    protein: nutrients.protein || '0', 
                    carbohydrates: nutrients.carbohydrates || '0',
                    fat: nutrients.fat || '0',
                    fiber: nutrients.fiber || '0',
                    sugar: nutrients.sugar || '0',
                    sodium: nutrients.sodium || '0'
                },
                dateAdded: date || new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            });
            
            console.log('New food entry to insert:', JSON.stringify(newFoodEntry, null, 2));
            
            const result = await newFoodEntry.save();
            console.log('Food entry added successfully:', result._id);
            
            res.json({
                success: true,
                message: 'Food has been added to your diary',
                entryId: result._id,
                entry: newFoodEntry
            });
            
        } catch (error) {
            console.error('ADD FOOD ERROR:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to add food entry',
                details: error.message
            });
        }
    });

    // Get food entries route
    app.post('/api/getfoodentries', async (req, res) => {
        console.log('=== GET FOOD ENTRIES ROUTE CALLED ===');
        const { userId, date } = req.body;
        
        console.log('Get food entries request:', { userId, date });
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        try {
            const query = { userId: userId };  // No need to parseInt since we store it as string
            
            // If date is provided, filter by date
            if (date) {
                query.dateAdded = date;
            }
            
            const entries = await FoodEntry.find(query);
            console.log('Found', entries.length, 'food entries for user', userId, 'on date', date);
            
            // Calculate total calories
            let totalCalories = 0;
            entries.forEach(entry => {
                if (entry.nutrients && entry.nutrients.calories) {
                    totalCalories += parseFloat(entry.nutrients.calories) || 0;
                }
            });
            
            res.json({
                success: true,
                foodEntries: entries,
                totalCalories: totalCalories.toFixed(1)
            });
        } catch (error) {
            console.error('Get food entries error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Delete food entry route
    app.post('/api/deletefoodentry', async (req, res) => {
        console.log('=== DELETE FOOD ENTRY ROUTE CALLED ===');
        const { userId, entryId } = req.body;
        
        console.log('Delete food entry request:', { userId, entryId });
        
        if (!entryId) {
            return res.status(400).json({ error: 'Entry ID is required' });
        }

        try {
            const result = await FoodEntry.deleteOne({ 
                _id: entryId,
                userId: userId // Also check userId for security
            });
            
            if (result.deletedCount === 1) {
                console.log('Food entry deleted successfully:', entryId);
                res.json({
                    success: true,
                    message: 'Food entry deleted'
                });
            } else {
                res.status(404).json({ error: 'Food entry not found' });
            }
        } catch (error) {
            console.error('Delete food entry error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    
    // Test route for USDA API
    app.get('/api/test-usda', async (req, res) => {
        try {
            console.log('Testing USDA API...');
            const foods = await searchUSDAFood('apple');
            res.json({ 
                success: true, 
                count: foods.length, 
                foods: foods.slice(0, 3),
                message: 'USDA API is working!'
            });
        } catch (error) {
            console.error('USDA API test failed:', error);
            res.json({ 
                success: false, 
                error: error.message,
                message: 'USDA API test failed'
            });
        }
    });
}