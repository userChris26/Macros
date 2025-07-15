'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindFriendsDialog } from "@/components/find-friends-dialog";
import { getApiUrl, decodeJWT } from "@/lib/utils";
import { toast } from "sonner";
import Cookies from 'js-cookie';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null;
}

interface FoodEntry {
  _id: string;
  userId: string;
  foodName: string;
  nutrients: {
    calories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
  };
  dateAdded: string;
  user: User;
  mealPhoto?: { url: string };
  mealType?: string;
}

export default function SocialPage() {
  const [following, setFollowing] = useState<User[]>([]);
  const [feedEntries, setFeedEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, []);

  useEffect(() => {
    if (following.length > 0) {
      fetchFeedEntries();
    }
  }, [following]);

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

  const fetchFeedEntries = async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch food entries for all following users
      const entriesPromises = following.map(user =>
        fetch(`${getApiUrl()}/api/getfoodentries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            date: today
          })
        }).then(res => res.json())
      );

      const results = await Promise.all(entriesPromises);
      
      // Combine all entries and add user information
      const allEntries = results.flatMap((result, index) => 
        result.foodEntries.map((entry: FoodEntry) => ({
          ...entry,
          user: following[index]
        }))
      );

      // Sort by date, newest first
      allEntries.sort((a, b) => 
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );

      setFeedEntries(allEntries);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error('Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold">Social Feed</h1>
      </div>

      <div className="flex justify-center gap-8">
        {/* Feed Column */}
        <div className="w-[500px] space-y-6">
          {/* Feed entries will go here */}
          {loading ? (
            <p className="text-center text-muted-foreground">Loading feed...</p>
          ) : feedEntries.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No food entries from people you follow today.
            </p>
          ) : (
            <div className="space-y-6">
              {feedEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="bg-card rounded-lg border overflow-hidden"
                >
                  {/* Header with user info */}
                  <div className="p-4 flex items-center gap-3 border-b">
                    {entry.user.profilePic ? (
                      <img
                        src={entry.user.profilePic}
                        alt={`${entry.user.firstName}'s profile`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm">
                        {entry.user.firstName[0]}
                        {entry.user.lastName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {entry.user.firstName} {entry.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Meal Photo */}
                  {entry.mealPhoto?.url && (
                    <div className="aspect-square w-full relative">
                      <img
                        src={entry.mealPhoto.url}
                        alt={`${entry.mealType} meal`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Food name and stats */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-lg font-semibold">{entry.foodName}</p>
                    </div>

                    {/* Macro stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Calories</p>
                        <p className="font-medium">{entry.nutrients.calories} kcal</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Protein</p>
                        <p className="font-medium">{entry.nutrients.protein}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Carbs</p>
                        <p className="font-medium">{entry.nutrients.carbohydrates}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fat</p>
                        <p className="font-medium">{entry.nutrients.fat}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                        <img
                          src={user.profilePic}
                          alt={`${user.firstName}'s profile`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
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