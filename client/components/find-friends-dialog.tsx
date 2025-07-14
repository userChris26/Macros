"use client";

import { useState } from "react";
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
import { UserPlus2, Search, Loader2 } from "lucide-react";
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

export function FindFriendsDialog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{[key: string]: boolean}>({});

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
    if (!token) {
      toast.error('Please log in to follow users');
      return;
    }

    // Decode the JWT to get the current user's ID
    const decoded = decodeJWT(token);
    if (!decoded) {
      toast.error('Invalid session, please log in again');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add token to headers
        },
        body: JSON.stringify({
          followerId: decoded.userId, // Use the decoded user ID
          followingId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to follow user' }));
        toast.error(errorData.error || 'Failed to follow user');
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFollowingStatus(prev => ({
        ...prev,
        [userId]: true
      }));
      
      toast.success('Successfully followed user');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
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
        
        <div className="space-y-4">
          {users.map((user) => (
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
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant={followingStatus[user.id] ? "secondary" : "default"}
                size="sm"
                onClick={() => !followingStatus[user.id] && handleFollow(user.id)}
                disabled={followingStatus[user.id]}
              >
                {followingStatus[user.id] ? "Following" : "Follow"}
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