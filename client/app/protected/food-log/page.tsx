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

interface FoodEntry {
  _id: string;
  foodName: string;
  servingSize: number;
  nutrients: {
    calories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
  };
  dateAdded: string;
}

export default function FoodLogPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [totalMacros, setTotalMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const token = Cookies.get('jwtToken');
  const decodedToken = token ? decodeJWT(token) : null;
  const userId = decodedToken?.userId;

  useEffect(() => {
    if (!userId) {
      toast.error("Please log in to view your food log");
      return;
    }
    fetchFoodEntries();
  }, [userId, selectedDate]); // Refetch when date or userId changes

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
        calculateTotalMacros(data.foodEntries);
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

  const calculateTotalMacros = (entries: FoodEntry[]) => {
    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + parseFloat(entry.nutrients.calories || '0'),
      protein: acc.protein + parseFloat(entry.nutrients.protein || '0'),
      carbs: acc.carbs + parseFloat(entry.nutrients.carbohydrates || '0'),
      fat: acc.fat + parseFloat(entry.nutrients.fat || '0'),
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });

    setTotalMacros(totals);
  };

  const handleFoodSelect = async (food: any, servingSize: number) => {
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
        await fetchFoodEntries(); // Refresh the list
        toast.success("Food entry deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete food entry");
      }
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error("Failed to delete food entry");
    }
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
      
      <div className="grid gap-4">
        {/* Macros Summary Card */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">
            {isToday ? "Today's" : format(selectedDate, "MMMM d's")} Macros
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Calories</p>
              <p className="text-2xl font-bold">{totalMacros.calories.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Protein</p>
              <p className="text-2xl font-bold">{totalMacros.protein.toFixed(1)}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carbs</p>
              <p className="text-2xl font-bold">{totalMacros.carbs.toFixed(1)}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fat</p>
              <p className="text-2xl font-bold">{totalMacros.fat.toFixed(1)}g</p>
            </div>
          </div>
        </div>

        {/* Food Entries List */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">
            {isToday ? "Today's" : format(selectedDate, "MMMM d's")} Entries
          </h2>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading...
            </div>
          ) : foodEntries.length > 0 ? (
            <div className="space-y-3">
              {foodEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
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
            <div className="text-center text-muted-foreground py-8">
              No food entries for {format(selectedDate, 'MMMM d, yyyy')}. 
              {isToday && " Click \"Add Food Entry\" to get started!"}
            </div>
          )}
        </div>
      </div>

      <FoodSearchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onFoodSelect={handleFoodSelect}
      />
    </div>
  );
} 