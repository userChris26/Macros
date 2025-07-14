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
  profilePic?: string;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    const token = Cookies.get('jwtToken');
    if (!token) {
      toast.error('Please log in to view your social feed');
      return;
    }

    // Decode the JWT to get the user ID
    const decoded = decodeJWT(token);
    if (!decoded) {
      toast.error('Invalid session, please log in again');
      return;
    }

    try {
      // Get following list using the decoded user ID
      const response = await fetch(`${getApiUrl()}/api/following/${decoded.userId}`);
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFollowing(data.following.map((f: any) => ({
        id: f.followingId._id,
        firstName: f.followingId.firstName,
        lastName: f.followingId.lastName,
        email: f.followingId.email,
        profilePic: f.followingId.profilePic
      })));

      // Fetch food entries for each followed user
      const entries = await Promise.all(
        data.following.map(async (f: any) => {
          const entriesResponse = await fetch(`${getApiUrl()}/api/getfoodentries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: f.followingId._id,
              // Get entries from the last 7 days
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }),
          });
          const entriesData = await entriesResponse.json();
          return entriesData.foodEntries.map((entry: FoodEntry) => ({
            ...entry,
            user: {
              id: f.followingId._id,
              firstName: f.followingId.firstName,
              lastName: f.followingId.lastName,
              email: f.followingId.email,
              profilePic: f.followingId.profilePic
            }
          }));
        })
      );

      // Flatten and sort by date
      const allEntries = entries.flat().sort((a, b) => 
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );

      setFeedEntries(allEntries);
    } catch (error) {
      console.error('Error fetching social data:', error);
      toast.error('Failed to load social feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    const token = Cookies.get('jwtToken');
    if (!token) return;

    // Decode the JWT to get the current user's ID
    const decoded = decodeJWT(token);
    if (!decoded) {
      toast.error('Invalid session, please log in again');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: decoded.userId,
          followingId: userId,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Remove from following list
      setFollowing(prev => prev.filter(f => f.id !== userId));
      // Remove their entries from feed
      setFeedEntries(prev => prev.filter(e => e.userId !== userId));
      
      toast.success('Successfully unfollowed user');
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow user');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
                You're not following anyone yet.
              </p>
            ) : (
              <div className="space-y-4">
                {following.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
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
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {feedEntries.length === 0 ? (
              <p className="text-muted-foreground">
                Follow some friends to see their food entries and progress!
              </p>
            ) : (
              <div className="space-y-4">
                {feedEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 mb-2">
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.dateAdded).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-11">
                      <p className="font-medium">{entry.foodName}</p>
                      <div className="text-sm text-muted-foreground">
                        <span>{entry.nutrients.calories} kcal</span>
                        <span className="mx-2">•</span>
                        <span>{entry.nutrients.protein}g protein</span>
                        <span className="mx-2">•</span>
                        <span>{entry.nutrients.carbohydrates}g carbs</span>
                        <span className="mx-2">•</span>
                        <span>{entry.nutrients.fat}g fat</span>
                      </div>
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