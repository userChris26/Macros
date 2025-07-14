'use client';

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function SocialFeedPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Feed</h1>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Friends/Following List - To be implemented */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Following</h2>
          <div className="text-center text-muted-foreground py-8">
            You&apos;re not following anyone yet.
          </div>
        </div>

        {/* Social Feed - To be implemented */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="text-center text-muted-foreground py-8">
            Follow some friends to see their food entries and progress!
          </div>
        </div>
      </div>
    </div>
  );
} 