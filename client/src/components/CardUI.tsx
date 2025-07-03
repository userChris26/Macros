/*import React, { useState } from 'react';
import { buildPath }  from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';

function CardUI()
{   
    const [message,setMessage] = useState('');
    const [searchResults,setResults] = useState('');
    const [cardList,setCardList] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [card,setCardNameValue] = React.useState('');
    
    let _ud : any = localStorage.getItem('user_data');
    let ud = JSON.parse( _ud );
    let userId : string = ud.userId;
    
    async function addCard(event:any) : Promise<void>
    {
        event.preventDefault();

        let obj = {userId:userId, card:card, userJwt:retrieveToken()};
        let js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/addcard'),
            {method:'POST', body:js, headers:{'Content-Type':'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Card has been added');
                storeToken(res.userJwt);
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    async function searchCard(event:any) : Promise<void>
    {
        event.preventDefault();

        let obj = {userId:userId, search:search, userJwt:retrieveToken()};
        let js = JSON.stringify(obj);
        
        try
        {
            const response = await fetch(buildPath('api/searchcards'),
            {method:'POST', body:js, headers:{'Content-Type':'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);
            let _results = res.results;
            let resultText = '';
            for( let i=0; i<_results.length; i++ )
            {
                resultText += _results[i];
                if( i < _results.length - 1 )
                {
                    resultText += ', ';
                }
            }

            setResults('Card(s) have been retrieved');
            storeToken( res.userJwt );
            setCardList(resultText);
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
    };

    function handleSearchTextChange( event: any ) : void
    {
        setSearchValue( event.target.value );
    }

    function handleCardTextChange( event: any ) : void
    {
        setCardNameValue( event.target.value );
    }

    return(
    <div id="cardUIDiv">
        <br />
        Search: <input type="text" id="searchText" placeholder="Card To Search For"
            onChange={handleSearchTextChange} />
        <button type="button" id="searchCardButton" className="buttons"
            onClick={searchCard}> Search Card</button><br />
        <span id="cardSearchResult">{searchResults}</span>
        <p id="cardList">{cardList}</p><br /><br />
        Add: <input type="text" id="cardText" placeholder="Card To Add"
            onChange={handleCardTextChange} />
        <button type="button" id="addCardButton" className="buttons"
            onClick={addCard}> Add Card </button><br />
        <span id="cardAddResult">{message}</span>
    </div>
    );
};

export default CardUI;*/
import { useState, useEffect } from 'react';

// Helper function to switch between local and production server
const app_name = '64.225.3.4'; // Updated to your production server IP

function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development'){
    return 'http://' + app_name + ':5000/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

// Interface for food search results
interface FoodItem {
  fdcId: number;
  description: string;
  brandOwner: string;
  brandName: string;
  dataType: string;
  servingSize: number;
  servingSizeUnit: string;
  householdServingFullText: string;
}

// Interface for food entries
interface FoodEntry {
  _id: string;
  fdcId: number;
  foodName: string;
  brandOwner: string;
  servingSize: number;
  servingSizeUnit: string;
  nutrients: {
    calories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
    fiber: string;
    sugar: string;
    sodium: string;
  };
  dateAdded: string;
  timestamp: string;
}

function CalorieTrackerUI() {
  // State variables for the calorie tracker
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<FoodItem[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState('0');
  const [search, setSearchValue] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Retrieve user data from local storage
  const _ud = localStorage.getItem('user_data');
  const ud = _ud ? JSON.parse(_ud) : {};
  const userId = ud.id;

  // Load food entries when component mounts or date changes
  useEffect(() => {
    if (userId) {
      loadFoodEntries();
    }
  }, [userId, selectedDate]);

  // Function to handle changes in the search text input
  function handleSearchTextChange(e: any): void {
    setSearchValue(e.target.value);
  }

  // Function to handle changes in the serving size input
  function handleServingSizeChange(e: any): void {
    setServingSize(e.target.value);
  }

  // Function to handle date change
  function handleDateChange(e: any): void {
    setSelectedDate(e.target.value);
  }

  // Load food entries for the selected date
  async function loadFoodEntries(): Promise<void> {
    try {
      const obj = { userId, date: selectedDate };
      const js = JSON.stringify(obj);

      const res = await fetch(buildPath('api/getfoodentries'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setFoodEntries(data.foodEntries);
        setTotalCalories(data.totalCalories);
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  // Asynchronous function to search for foods via USDA API
  async function searchFoods(e: any): Promise<void> {
    e.preventDefault();

    if (!search.trim()) {
      setSearchResults('Please enter a food to search for');
      return;
    }

    const obj = { query: search };
    const js = JSON.stringify(obj);

    try {
      const res = await fetch(buildPath('api/searchfoods'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.error) {
        setSearchResults(data.error);
        setFoodSearchResults([]);
      } else {
        setSearchResults(`Found ${data.foods.length} food(s)`);
        setFoodSearchResults(data.foods);
      }
    } catch (error: any) {
      setSearchResults(error.toString());
      setFoodSearchResults([]);
    }
  }

  // Function to select a food for adding
  function selectFood(food: FoodItem): void {
    setSelectedFood(food);
    setServingSize(food.servingSize.toString() || '100');
  }

  // Asynchronous function to add a food entry
  async function addFood(e: any): Promise<void> {
    e.preventDefault();

    if (!selectedFood) {
      setMessage('Please select a food first');
      return;
    }

    if (!servingSize || parseFloat(servingSize) <= 0) {
      setMessage('Please enter a valid serving size');
      return;
    }

    const obj = { 
      userId, 
      fdcId: selectedFood.fdcId, 
      servingSize: parseFloat(servingSize),
      date: selectedDate
    };
    const js = JSON.stringify(obj);

    try {
      const res = await fetch(buildPath('api/addfood'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage('Food has been added to your diary');
        setSelectedFood(null);
        setServingSize('');
        setSearchValue('');
        setFoodSearchResults([]);
        setSearchResults('');
        // Reload food entries to show the new addition
        loadFoodEntries();
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  // Function to delete a food entry
  async function deleteFoodEntry(entryId: string): Promise<void> {
    const obj = { userId, entryId };
    const js = JSON.stringify(obj);

    try {
      const res = await fetch(buildPath('api/deletefoodentry'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage('Food entry deleted');
        loadFoodEntries(); // Reload entries
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  return (
    <div id="calorieTrackerDiv">
      <h2>Calorie Tracker</h2>
      
      {/* Date Selection */}
      <div className="date-section">
        <label htmlFor="dateSelect">Date: </label>
        <input
          type="date"
          id="dateSelect"
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>
      
      <br />
      
      {/* Food Search Section */}
      <div className="search-section">
        <h3>Search Foods</h3>
        <input
          type="text"
          id="searchText"
          placeholder="Search for foods (e.g., chicken breast, apple)"
          value={search}
          onChange={handleSearchTextChange}
        />
        <button
          type="button"
          id="searchFoodButton"
          className="buttons"
          onClick={searchFoods}
        >
          Search Foods
        </button>
        <br />
        <span id="foodSearchResult">{searchResults}</span>
        
        {/* Display search results */}
        {foodSearchResults.length > 0 && (
          <div id="foodSearchResults">
            <h4>Search Results:</h4>
            {foodSearchResults.map((food, index) => (
              <div key={index} className="food-item">
                <strong>{food.description}</strong>
                {food.brandOwner && <span> - {food.brandOwner}</span>}
                {food.servingSize > 0 && (
                  <span> (Serving: {food.servingSize}{food.servingSizeUnit})</span>
                )}
                <button
                  type="button"
                  className="select-button"
                  onClick={() => selectFood(food)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <br />

      {/* Add Food Section */}
      {selectedFood && (
        <div className="add-section">
          <h3>Add Food</h3>
          <div className="selected-food">
            <strong>Selected: {selectedFood.description}</strong>
            {selectedFood.brandOwner && <span> - {selectedFood.brandOwner}</span>}
          </div>
          <label htmlFor="servingSize">Serving Size (grams): </label>
          <input
            type="number"
            id="servingSize"
            placeholder="Enter serving size in grams"
            value={servingSize}
            onChange={handleServingSizeChange}
            min="1"
            step="0.1"
          />
          <button
            type="button"
            id="addFoodButton"
            className="buttons"
            onClick={addFood}
          >
            Add Food
          </button>
          <br />
          <span id="foodAddResult">{message}</span>
        </div>
      )}

      <br />

      {/* Daily Summary */}
      <div className="summary-section">
        <h3>Daily Summary for {selectedDate}</h3>
        <div className="total-calories">
          <strong>Total Calories: {totalCalories}</strong>
        </div>
        
        {/* Food Entries List */}
        {foodEntries.length > 0 ? (
          <div id="foodEntriesList">
            <h4>Food Entries:</h4>
            {foodEntries.map((entry, index) => (
              <div key={index} className="food-entry">
                <div className="food-entry-header">
                  <strong>{entry.foodName}</strong>
                  {entry.brandOwner && <span> - {entry.brandOwner}</span>}
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteFoodEntry(entry._id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="food-entry-details">
                  <span>Serving: {entry.servingSize}g</span>
                  {entry.nutrients.calories && (
                    <span> | Calories: {entry.nutrients.calories}</span>
                  )}
                  {entry.nutrients.protein && (
                    <span> | Protein: {entry.nutrients.protein}g</span>
                  )}
                  {entry.nutrients.carbohydrates && (
                    <span> | Carbs: {entry.nutrients.carbohydrates}g</span>
                  )}
                  {entry.nutrients.fat && (
                    <span> | Fat: {entry.nutrients.fat}g</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No food entries for this date. Start by searching and adding foods!</p>
        )}
      </div>
    </div>
  );
}

export default CalorieTrackerUI;