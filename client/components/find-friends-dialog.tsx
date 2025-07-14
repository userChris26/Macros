"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPlus2, Search, Loader2, UserMinus2 } from "lucide-react";
import { getApiUrl, decodeJWT } from "@/lib/utils";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null;
}

export function FindFriendsDialog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{[key: string]: boolean}>({});

  // Get current user's following list on mount
  useEffect(() => {
    const fetchFollowing = async () => {
      const token = Cookies.get('jwtToken');
      if (!token) return;

      const decoded = decodeJWT(token);
      if (!decoded) return;

      try {
        const response = await fetch(`${getApiUrl()}/api/following/${decoded.userId}`);
        const data = await response.json();
        
        if (data.error) {
          toast.error(data.error);
          return;
        }
        
        // Create a map of followingId -> true
        const followingMap = data.following.reduce((acc: {[key: string]: boolean}, follow: any) => {
          acc[follow.followingId._id] = true;
          return acc;
        }, {});
        
        setFollowingStatus(followingMap);
      } catch (error) {
        console.error('Error fetching following:', error);
      }
    };

    fetchFollowing();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setUsers(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    const token = Cookies.get('jwtToken');
    if (!token) return;

    const decoded = decodeJWT(token);
    if (!decoded) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: decoded.userId,
          followingId: userId
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setFollowingStatus(prev => ({ ...prev, [userId]: true }));
      toast.success('User followed successfully');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: string) => {
    const token = Cookies.get('jwtToken');
    if (!token) return;

    const decoded = decodeJWT(token);
    if (!decoded) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: decoded.userId,
          followingId: userId
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setFollowingStatus(prev => ({ ...prev, [userId]: false }));
      toast.success('User unfollowed successfully');
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow user');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus2 className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Find Friends</DialogTitle>
          <DialogDescription>
            Search for other users to follow and see their food logs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 my-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {user.profilePic ? (
                    <AvatarImage src={user.profilePic} alt={`${user.firstName}'s profile`} />
                  ) : (
                    <AvatarFallback>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant={followingStatus[user.id] ? "secondary" : "default"}
                size="sm"
                onClick={() => followingStatus[user.id] 
                  ? handleUnfollow(user.id)
                  : handleFollow(user.id)
                }
              >
                {followingStatus[user.id] ? (
                  <>
                    <UserMinus2 className="mr-2 h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus2 className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          ))}
          {users.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground">
              No users found. Try searching for someone!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 