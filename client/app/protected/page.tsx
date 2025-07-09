'use client';

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('jwtToken');
    if (!token) {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 max-w-4xl px-3">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome to your protected dashboard! You&apos;re successfully logged in.
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="font-bold text-2xl mb-4">Your Dashboard</h2>
          <p>This is where you&apos;ll see your macros tracking and food entries.</p>
        </section>
      </div>
    </div>
  );
}

