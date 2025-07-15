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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Feed</h1>
        <FindFriendsDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Following List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Following</CardTitle>
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

        {/* Feed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading feed...</p>
            ) : feedEntries.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No food entries from people you follow today.
              </p>
            ) : (
              <div className="space-y-4">
                {feedEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      {entry.user.profilePic ? (
                        <img
                          src={entry.user.profilePic}
                          alt={`${entry.user.firstName}'s profile`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                          {entry.user.firstName[0]}
                          {entry.user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {entry.user.firstName} {entry.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.dateAdded).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="pl-11">
                      <p className="font-medium">{entry.foodName}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.nutrients.calories} kcal • {entry.nutrients.protein}g protein • {entry.nutrients.carbohydrates}g carbs • {entry.nutrients.fat}g fat
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
  );
} 