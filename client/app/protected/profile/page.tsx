'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Edit2 } from "lucide-react";

export default function ProfilePage() {
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
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h2 className="font-semibold">John Doe</h2>
                <p className="text-sm text-muted-foreground">Joined January 2024</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Profile Information</h3>
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell us about yourself..." />
            </div>
            <Button>Save Changes</Button>
          </form>
        </Card>
      </div>
    </div>
  );
} 