'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getApiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface FoodSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date?: string;
  onFoodAdded?: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface SearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
}

interface FoodDetails {
  fdcId: number;
  description: string;
  dataType: string;
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  portion: {
    gramWeight: number;
    servingsPerHundredGrams: number;
    modifier: string;
    measureUnit: string;
  };
}

export function FoodSearchDialog({ open, onOpenChange, userId, date, onFoodAdded, mealType }: FoodSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodDetails | null>(null);
  const [servingAmount, setServingAmount] = useState(1);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/searchfoods?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.foods || []);
      } else {
        toast.error(data.error || 'Failed to search foods');
      }
    } catch (error) {
      toast.error('Failed to search foods');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = async (food: SearchResult) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/food/${food.fdcId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedFood(data.food);
        // Set default serving amount based on servingsPerHundredGrams
        setServingAmount(data.food.portion.servingsPerHundredGrams || 1);
      } else {
        toast.error(data.error || 'Failed to get food details');
      }
    } catch (error) {
      toast.error('Failed to get food details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/addfood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fdcId: selectedFood.fdcId,
          servingAmount,
          mealType,
          date
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Food added successfully');
        onOpenChange(false);
        // Reset state
        setSearchQuery('');
        setSearchResults([]);
        setSelectedFood(null);
        setServingAmount(1);
        // Call the callback if provided
        onFoodAdded?.();
      } else {
        toast.error(data.error || 'Failed to add food');
      }
    } catch (error) {
      toast.error('Failed to add food');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Food to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for a food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((food) => (
                <div
                  key={food.fdcId}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFood?.fdcId === food.fdcId
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleFoodSelect(food)}
                >
                  <div className="font-medium">{food.description}</div>
                  {food.dataType === 'Branded' && (
                    <div className="text-sm text-muted-foreground">
                      {food.brandName} • {food.brandOwner}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-4 text-muted-foreground">
              No results found
            </div>
          ) : null}
        </div>

        {/* Serving Size Input */}
        {selectedFood && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servingAmount">
                Serving size
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="servingAmount"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={servingAmount}
                  onChange={(e) => setServingAmount(parseFloat(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">
                  ({(servingAmount * selectedFood.portion.gramWeight).toFixed(0)}g)
                </span>
              </div>
              {/* Show nutrients for selected amount */}
              <div className="mt-2 text-sm space-y-1">
                <div className="grid grid-cols-2 gap-x-4">
                  <div>Calories: {(selectedFood.nutrients.calories * servingAmount).toFixed(0)}</div>
                  <div>Protein: {(selectedFood.nutrients.protein * servingAmount).toFixed(1)}g</div>
                  <div>Carbs: {(selectedFood.nutrients.carbohydrates * servingAmount).toFixed(1)}g</div>
                  <div>Fat: {(selectedFood.nutrients.fat * servingAmount).toFixed(1)}g</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Food Button */}
        {selectedFood && (
          <Button
            className="w-full mt-4"
            onClick={handleAddFood}
          >
            Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
} 