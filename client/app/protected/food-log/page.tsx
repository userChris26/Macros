'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { FoodSearchDialog } from "@/components/food-search-dialog";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import { getApiUrl, decodeJWT } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MealPhotoUpload } from '@/components/meal-photo-upload';

interface FoodEntry {
  _id: string;
  foodName: string;
  servingSize: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutrients: {
    calories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
  };
  dateAdded: string;
}

interface MealSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyMacros {
  total: MealSummary;
  breakfast: MealSummary;
  lunch: MealSummary;
  dinner: MealSummary;
  snack: MealSummary;
}

interface MealData {
  _id: string;
  photo?: {
    url: string;
    publicId: string;
  };
  foods: FoodEntry[];
}

interface MealMap {
  [key: string]: MealData | null;
}

const emptyMealSummary: MealSummary = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

const emptyDailyMacros: DailyMacros = {
  total: { ...emptyMealSummary },
  breakfast: { ...emptyMealSummary },
  lunch: { ...emptyMealSummary },
  dinner: { ...emptyMealSummary },
  snack: { ...emptyMealSummary }
};

export default function FoodLogPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [macros, setMacros] = useState<DailyMacros>(emptyDailyMacros);
  const [meals, setMeals] = useState<MealMap>({});

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const token = Cookies.get('jwtToken');
  const decodedToken = token ? decodeJWT(token) : null;
  const userId = decodedToken?.userId;

  // Add fetchMealData function
  const fetchMealData = async () => {
    if (!userId) return;

    try {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const newMeals: MealMap = {};

      await Promise.all(
        mealTypes.map(async (type) => {
          const response = await fetch(
            `${getApiUrl()}/api/meal/${userId}/${formattedDate}/${type}`
          );
          const data = await response.json();
          newMeals[type] = data.success ? data.meal : null;
        })
      );

      setMeals(newMeals);
    } catch (error) {
      console.error('Error fetching meal data:', error);
      toast.error('Failed to fetch meal data');
    }
  };

  useEffect(() => {
    if (!userId) {
      toast.error("Please log in to view your food log");
      return;
    }
    fetchFoodEntries();
    fetchMealData();
  }, [userId, selectedDate]);

  const fetchFoodEntries = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/getfoodentries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, date: formattedDate }),
      });

      const data = await response.json();
      if (data.success) {
        setFoodEntries(data.foodEntries);
        calculateMacros(data.foodEntries);
      } else {
        toast.error(data.error || "Failed to fetch food entries");
      }
    } catch (error) {
      console.error('Error fetching food entries:', error);
      toast.error("Failed to fetch food entries");
    } finally {
      setLoading(false);
    }
  };

  const calculateMacros = (entries: FoodEntry[]) => {
    const newMacros: DailyMacros = { ...emptyDailyMacros };

    entries.forEach(entry => {
      const mealType = entry.mealType || 'snack';
      const calories = parseFloat(entry.nutrients.calories || '0');
      const protein = parseFloat(entry.nutrients.protein || '0');
      const carbs = parseFloat(entry.nutrients.carbohydrates || '0');
      const fat = parseFloat(entry.nutrients.fat || '0');

      // Add to meal-specific totals
      newMacros[mealType].calories += calories;
      newMacros[mealType].protein += protein;
      newMacros[mealType].carbs += carbs;
      newMacros[mealType].fat += fat;

      // Add to daily totals
      newMacros.total.calories += calories;
      newMacros.total.protein += protein;
      newMacros.total.carbs += carbs;
      newMacros.total.fat += fat;
    });

    setMacros(newMacros);
  };

  const handleFoodSelect = async (food: any, servingSize: number, mealType: string) => {
    if (!userId) {
      toast.error("User ID not found. Please try logging in again.");
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/addfood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fdcId: food.fdcId,
          servingSize,
          mealType,
          date: formattedDate
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFoodEntries();
        toast.success("Food entry added successfully");
      } else {
        toast.error(data.error || "Failed to add food entry");
      }
    } catch (error) {
      console.error('Error adding food:', error);
      toast.error("Failed to add food entry");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/deletefoodentry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, entryId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFoodEntries();
        toast.success("Food entry deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete food entry");
      }
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error("Failed to delete food entry");
    }
  };

  const handlePhotoUpdate = () => {
    fetchMealData();
  };

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const entries = foodEntries.filter(entry => entry.mealType === mealType);
    const mealMacros = macros[mealType];
    const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    const meal = meals[mealType];

    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{capitalizedMealType}</h3>
          <div className="text-sm text-muted-foreground">
            {mealMacros.calories.toFixed(0)} kcal
          </div>
        </div>

        <div className="flex gap-6">
          {/* Photo Upload Section */}
          {userId && (
            <MealPhotoUpload
              userId={userId}
              date={formattedDate}
              mealType={mealType}
              onPhotoUpdate={handlePhotoUpdate}
              photoUrl={meal?.photo?.url}
            />
          )}

          {/* Food Entries Section */}
          <div className="flex-1">
            {entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{entry.foodName}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.servingSize}g • {entry.nutrients.calories} kcal
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No {mealType} entries yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center text-muted-foreground py-8">
          Please log in to view your food log.
        </div>
      </div>
    );
  }

  const isToday = formattedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Food Log</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Food Entry
        </Button>
      </div>
      
      {/* Macros Summary Card */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">
          {isToday ? "Today's" : format(selectedDate, "MMMM d's")} Macros
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Calories</p>
            <p className="text-2xl font-bold">{macros.total.calories.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Protein</p>
            <p className="text-2xl font-bold">{macros.total.protein.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Carbs</p>
            <p className="text-2xl font-bold">{macros.total.carbs.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fat</p>
            <p className="text-2xl font-bold">{macros.total.fat.toFixed(1)}g</p>
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="grid gap-6">
        {renderMealSection('breakfast')}
        {renderMealSection('lunch')}
        {renderMealSection('dinner')}
        {renderMealSection('snack')}
      </div>

      <FoodSearchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onFoodSelect={handleFoodSelect}
      />
    </div>
  );
} 