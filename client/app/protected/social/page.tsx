'use client';

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindFriendsDialog } from "@/components/find-friends-dialog";
import { getApiUrl, decodeJWT } from "@/lib/utils";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import Image from "next/image";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null;
}

interface FoodEntry {
  _id: string;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  servingAmount: number;
  servingUnit: string;
  nutrients: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}

interface Meal {
  _id: string;
  user: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  foods: FoodEntry[];
  photo?: {
    url: string;
    publicId: string;
  };
}

interface MealWithUser extends Meal {
  userData: User;
}

export default function SocialPage() {
  const [following, setFollowing] = useState<User[]>([]);
  const [feedMeals, setFeedMeals] = useState<MealWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedMeals = useCallback(async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch meals for all following users
      const mealsPromises = following.map(async user => {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const userMeals = await Promise.all(
          mealTypes.map(type =>
            fetch(`${getApiUrl()}/api/meal/${user.id}/${today}/${type}`)
              .then(res => res.json())
              .then(data => data.success && data.meal ? { ...data.meal, userData: user } : null)
          )
        );
        return userMeals.filter(Boolean);
      });

      const results = await Promise.all(mealsPromises);
      
      // Flatten and sort by date and meal time
      const allMeals = results
        .flat()
        .sort((a, b) => {
          // First compare dates
          const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateComparison !== 0) return dateComparison;

          // If same date, sort by meal time (reverse order)
          const mealOrder: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', number> = {
            breakfast: 0,
            lunch: 1,
            dinner: 2,
            snack: 3
          };
          // Ensure meal times are typed correctly
          const aMealTime = a.mealTime as keyof typeof mealOrder;
          const bMealTime = b.mealTime as keyof typeof mealOrder;
          return mealOrder[bMealTime] - mealOrder[aMealTime];
        });

      setFeedMeals(allMeals);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error('Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  }, [following]); // Add following as a dependency since it's used in the function

  useEffect(() => {
    fetchFollowing();
  }, []); // Run once on mount

  useEffect(() => {
    if (following.length > 0) {
      fetchFeedMeals();
    }
  }, [following, fetchFeedMeals]); // Add fetchFeedMeals to dependencies

  const fetchFollowing = async () => {
    const token = Cookies.get('jwtToken');
    if (!token) {
      toast.error('Please log in to view your social feed');
      return;
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      toast.error('Invalid session, please log in again');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/following/${decoded.userId}`);
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Transform the data to match our User interface
      const followingUsers = data.following.map((follow: any) => ({
        id: follow.followingId._id,
        firstName: follow.followingId.firstName,
        lastName: follow.followingId.lastName,
        email: follow.followingId.email,
        profilePic: follow.followingId.profilePic || null
      }));
      
      setFollowing(followingUsers);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error('Failed to fetch following');
    }
  };

  // Calculate total nutrients for a meal
  const calculateMealTotals = (foods: FoodEntry[]) => {
    return foods.reduce((acc, food) => ({
      calories: acc.calories + food.nutrients.calories,
      protein: acc.protein + food.nutrients.protein,
      carbs: acc.carbs + food.nutrients.carbohydrates,
      fat: acc.fat + food.nutrients.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold">Social Feed</h1>
      </div>

      <div className="flex justify-center gap-8">
        {/* Feed Column */}
        <div className="w-[500px] space-y-6">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading feed...</p>
          ) : feedMeals.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No meals from people you follow today.
            </p>
          ) : (
            <div className="space-y-6">
              {feedMeals.map((meal) => {
                const totals = calculateMealTotals(meal.foods);
                return (
                  <div
                    key={meal._id}
                    className="bg-card rounded-lg border overflow-hidden"
                  >
                    {/* Header with user info */}
                    <div className="p-4 flex items-center gap-3 border-b">
                      {meal.userData.profilePic ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={meal.userData.profilePic}
                            alt={`${meal.userData.firstName}'s profile`}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm">
                          {meal.userData.firstName[0]}
                          {meal.userData.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {meal.userData.firstName} {meal.userData.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          {meal.mealTime.charAt(0).toUpperCase() + meal.mealTime.slice(1)}
                        </p>
                      </div>
                    </div>

                    {/* Meal Photo */}
                    {meal.photo?.url && (
                      <div className="aspect-square w-full relative">
                        <Image
                          src={meal.photo.url}
                          alt={`${meal.mealTime} meal`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Food list and stats */}
                    <div className="p-4">
                      {/* Food items */}
                      <div className="mb-4 space-y-2">
                        {meal.foods.map((food) => (
                          <div key={food._id} className="text-sm">
                            <span className="font-medium">{food.description}</span>
                            <span className="text-muted-foreground">
                              {' • '}
                              {food.servingAmount} {food.servingUnit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Macro stats */}
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Calories</p>
                          <p className="font-medium">{totals.calories.toFixed(0)} kcal</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Protein</p>
                          <p className="font-medium">{totals.protein.toFixed(1)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Carbs</p>
                          <p className="font-medium">{totals.carbs.toFixed(1)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fat</p>
                          <p className="font-medium">{totals.fat.toFixed(1)}g</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Following List Column */}
        <div className="w-[300px]">
          <Card className="sticky top-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Following</CardTitle>
              <FindFriendsDialog />
            </CardHeader>
            <CardContent>
              {following.length === 0 ? (
                <p className="text-muted-foreground">
                  You&apos;re not following anyone yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {following.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      {user.profilePic ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={user.profilePic}
                            alt={`${user.firstName}'s profile`}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 