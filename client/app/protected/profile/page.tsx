'use client';

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { decodeJWT, getApiUrl } from "@/lib/utils";
import Cookies from 'js-cookie';
import { toast } from "sonner";

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null;
  bio: string | null;
  stats: {
    following: number;
    followers: number;
  };
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    const token = Cookies.get('jwtToken');
    if (!token) return;

    const decoded = decodeJWT(token);
    if (!decoded) return;

    // Initialize form data with decoded JWT data
    setFormData({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      bio: decoded.bio || ''
    });

    // Fetch full profile data including stats
    const fetchProfile = async () => {
      try {
        // First get user data
        const userResponse = await fetch(`${getApiUrl()}/api/user/${decoded.userId}`);
        const userData = await userResponse.json();
        
        if (userData.error) {
          toast.error(userData.error);
          return;
        }

        // Then get stats
        const statsResponse = await fetch(`${getApiUrl()}/api/dashboard/stats/${decoded.userId}`);
        const statsData = await statsResponse.json();

        if (statsData.error) {
          toast.error(statsData.error);
          return;
        }

        // Update form data with fetched user data
        setFormData(prev => ({
          ...prev,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          email: userData.user.email,
          bio: userData.user.bio || ''
        }));

        // Combine user data with stats
        setProfile({
          userId: decoded.userId,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          email: userData.user.email,
          profilePic: userData.user.profilePic,
          bio: userData.user.bio,
          stats: {
            following: statsData.stats.following,
            followers: statsData.stats.followers
          }
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get('jwtToken');
      if (!token || !profile) return;

      const response = await fetch(`${getApiUrl()}/api/user/${profile.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio || null  // Ensure bio is null if empty
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      // Update profile state with new data
      setProfile(prev => prev ? {
        ...prev,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        bio: data.user.bio
      } : null);

      // Update form data to match
      setFormData(prev => ({
        ...prev,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        bio: data.user.bio || ''
      }));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress as JPEG with 0.8 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit for original file)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image before upload
      const compressedBase64 = await compressImage(file);
      
      // Convert base64 to blob
      const base64Response = await fetch(compressedBase64);
      const compressedBlob = await base64Response.blob();
      
      // Create a File from the Blob
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg'
      });

      // Check compressed size
      if (compressedFile.size > 5 * 1024 * 1024) {
        throw new Error('Compressed image is still too large. Please try a smaller image.');
      }

      const token = Cookies.get('jwtToken');
      if (!token) return;

      const formData = new FormData();
      formData.append('profilePic', compressedFile);

      const response = await fetch(`${getApiUrl()}/api/upload-profile-pic/${profile.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update profile with new picture URL
      setProfile(prev => prev ? {
        ...prev,
        profilePic: data.user.profilePic
      } : null);

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Profile Picture & Stats */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  {profile.profilePic ? (
                    <AvatarImage src={profile.profilePic} alt={`${profile.firstName}'s profile`} />
                  ) : (
                    <AvatarFallback className="text-4xl">
                      {profile.firstName[0]}
                      {profile.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-center">
                <h2 className="font-semibold">{profile.firstName} {profile.lastName}</h2>
                <p className="text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{profile.stats.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.stats.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Profile Information</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
} 