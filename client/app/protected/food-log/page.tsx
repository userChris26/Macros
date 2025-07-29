'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { FoodSearchDialog } from "@/components/food-search-dialog";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import { getApiUrl, decodeJWT } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MealPhotoUpload } from '@/components/meal-photo-upload';

interface FoodEntry {
  _id: string;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  servingAmount: number;
  servingUnit: string;
  gramWeight: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutrients: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  date: string;
}

interface MealSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
  mealTime: MealType;
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
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<{ id: string; mealType: MealType; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [macros, setMacros] = useState<DailyMacros>(emptyDailyMacros);
  const [meals, setMeals] = useState<MealMap>({});

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const token = Cookies.get('jwtToken');
  const decodedToken = token ? decodeJWT(token) : null;
  const userId = decodedToken?.userId;

  // Memoize fetchMealData to prevent recreation on every render
  const fetchMealData = useCallback(async () => {
    if (!userId) return;

    try {
      const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
      const newMeals: MealMap = {};
      const newMacros = {
        total: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };

      await Promise.all(
        mealTypes.map(async (type) => {
          const response = await fetch(
            `${getApiUrl()}/api/meal/${userId}/${formattedDate}/${type}`
          );
          const data = await response.json();
          
          if (data.success && data.meal) {
            newMeals[type] = data.meal;
            
            // Calculate macros for this meal once
            data.meal.foods.forEach((food: FoodEntry) => {
              newMacros[type].calories += food.nutrients.calories;
              newMacros[type].protein += food.nutrients.protein;
              newMacros[type].carbs += food.nutrients.carbohydrates;
              newMacros[type].fat += food.nutrients.fat;

              // Add to daily totals
              newMacros.total.calories += food.nutrients.calories;
              newMacros.total.protein += food.nutrients.protein;
              newMacros.total.carbs += food.nutrients.carbohydrates;
              newMacros.total.fat += food.nutrients.fat;
            });
          } else {
            newMeals[type] = null;
          }
        })
      );

      setMeals(newMeals);
      setMacros(newMacros);
    } catch (error) {
      console.error('Error fetching meal data:', error);
      toast.error('Failed to fetch meal data');
    } finally {
      setLoading(false);
    }
  }, [userId, formattedDate]); // Include dependencies that fetchMealData uses

  useEffect(() => {
    if (!userId) {
      toast.error("Please log in to view your food log");
      return;
    }
    fetchMealData();
  }, [userId, selectedDate, fetchMealData]); // Now we can safely include fetchMealData

  const handleDeleteEntry = async (foodId: string, mealType: MealType, description: string) => {
    setFoodToDelete({ id: foodId, mealType, description });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!foodToDelete) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/deletefood/${foodToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Food entry deleted');
        fetchMealData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to delete food entry');
      }
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast.error('Failed to delete food entry');
    } finally {
      setDeleteConfirmOpen(false);
      setFoodToDelete(null);
    }
  };

  const handlePhotoUpdate = () => {
    fetchMealData();
  };

  const handleFoodAdded = () => {
    fetchMealData(); // Refresh data when food is added
    setIsDialogOpen(false); // Close the dialog
  };

  const handleAddFoodClick = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedMealType(null);
    }
  };

  const renderMealSection = (mealType: MealType) => {
    const meal = meals[mealType];
    const mealMacros = macros[mealType];
    const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);

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
            {meal && meal.foods.length > 0 ? (
              <div className="space-y-2">
                {meal.foods.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{entry.description}</div>
                      {entry.dataType === 'Branded' && (
                        <div className="text-sm text-muted-foreground">
                          {entry.brandName} • {entry.brandOwner}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {entry.servingAmount} {entry.servingUnit} • {entry.nutrients.calories.toFixed(0)} kcal
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry._id, mealType, entry.description)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No food entries yet
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => handleAddFoodClick(mealType)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Food
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Food Log</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Daily Totals */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium">Calories</div>
          <div className="text-2xl font-bold">{macros.total.calories.toFixed(0)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium">Protein</div>
          <div className="text-2xl font-bold">{macros.total.protein.toFixed(0)}g</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium">Carbs</div>
          <div className="text-2xl font-bold">{macros.total.carbs.toFixed(0)}g</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium">Fat</div>
          <div className="text-2xl font-bold">{macros.total.fat.toFixed(0)}g</div>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-6">
        {renderMealSection('breakfast')}
        {renderMealSection('lunch')}
        {renderMealSection('dinner')}
        {renderMealSection('snack')}
      </div>

      {/* Food Search Dialog */}
      {selectedMealType && (
        <FoodSearchDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          userId={userId || ''}
          date={formattedDate}
          onFoodAdded={handleFoodAdded}
          mealType={selectedMealType}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Food Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{foodToDelete?.description}&quot; from {foodToDelete?.mealType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 