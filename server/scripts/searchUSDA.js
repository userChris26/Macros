require('dotenv').config();
exports.searchUSDAFood = async (query)
{
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