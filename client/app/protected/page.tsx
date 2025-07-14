'use client';

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { getApiUrl } from "@/lib/utils";

interface DashboardStats {
  totalCalories: number;
  totalEntries: number;
  following: number;
}

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCalories: 0,
    totalEntries: 0,
    following: 0
  });

  const fetchDashboardStats = async () => {
    const userId = Cookies.get('userId');
    const today = new Date().toISOString().split('T')[0];

    try {
      const response = await fetch(`${getApiUrl()}/api/getfoodentries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, date: today }),
      });

      const data = await response.json();
      if (data.success) {
        setStats({
          totalCalories: data.foodEntries.reduce((acc: number, entry: any) => 
            acc + parseFloat(entry.nutrients.calories || '0'), 0),
          totalEntries: data.foodEntries.length,
          following: 0 // Placeholder for now
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    const token = Cookies.get('jwtToken');
    if (!token) {
      router.push('/auth/login');
    } else {
      fetchDashboardStats();
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4">
        {/* Welcome Message */}
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome to your dashboard! Track your nutrition, connect with friends, and reach your goals.
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Today&apos;s Calories</h3>
            <p className="text-2xl font-bold">{stats.totalCalories.toFixed(0)}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Food Entries</h3>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Following</h3>
            <p className="text-2xl font-bold">{stats.following}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

