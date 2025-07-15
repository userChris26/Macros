'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getApiUrl } from '@/lib/utils';

interface FoodSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodSelect: (food: any, servingSize: number, mealType: string) => void;
}

export function FoodSearchDialog({ open, onOpenChange, onFoodSelect }: FoodSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [servingSize, setServingSize] = useState('100');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/searchfoods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.foods || []);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = (food: any) => {
    setSelectedFood(food);
  };

  const handleAddFood = (mealType: string) => {
    if (selectedFood && servingSize) {
      onFoodSelect(selectedFood, parseFloat(servingSize), mealType);
      onOpenChange(false);
      // Reset state
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFood(null);
      setServingSize('100');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Foods</DialogTitle>
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
                  <div className="text-sm text-muted-foreground">
                    {food.brandOwner || 'Generic'}
                  </div>
                  {selectedFood?.fdcId === food.fdcId && (
                    <div className="mt-2 text-sm">
                      {food.foodNutrients
                        ?.filter((n: any) => 
                          ['Energy', 'Protein', 'Total lipid (fat)', 'Carbohydrate, by difference']
                          .includes(n.nutrientName)
                        )
                        .map((nutrient: any) => (
                          <div key={nutrient.nutrientId}>
                            {nutrient.nutrientName}: {nutrient.value} {nutrient.unitName}
                          </div>
                        ))}
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
              <Label htmlFor="servingSize">Serving Size (g)</Label>
              <Input
                id="servingSize"
                type="number"
                min="0"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Meal Type Buttons */}
        {selectedFood && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              onClick={() => handleAddFood('breakfast')}
              disabled={!selectedFood || !servingSize}
              variant="outline"
              className="w-full"
            >
              Add to Breakfast
            </Button>
            <Button
              onClick={() => handleAddFood('lunch')}
              disabled={!selectedFood || !servingSize}
              variant="outline"
              className="w-full"
            >
              Add to Lunch
            </Button>
            <Button
              onClick={() => handleAddFood('dinner')}
              disabled={!selectedFood || !servingSize}
              variant="outline"
              className="w-full"
            >
              Add to Dinner
            </Button>
            <Button
              onClick={() => handleAddFood('snack')}
              disabled={!selectedFood || !servingSize}
              variant="outline"
              className="w-full"
            >
              Add to Snack
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 