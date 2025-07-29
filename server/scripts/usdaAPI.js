exports.retrieve = async function(fdcId)
{
    // First get the food details from USDA
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&nutrients=203,204,205,208`;
    const response = await fetch(url);

    if (!response.ok)
    {
        throw new Error(`USDA API error: ${response.status}`);
    }

    return await response.json();
}

exports.query =  async function(query)
{
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=25`;
    const response = await fetch(url);
    
    if (!response.ok)
    {
        throw new Error(`USDA API error: ${response.status}`);
    }
    
    return await response.json();
}