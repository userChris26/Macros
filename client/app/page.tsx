'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Hero } from "@/components/hero";
import { AuthButton } from "@/components/auth-button";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('jwtToken');
    if (token) {
      router.replace('/protected/social');
    }
  }, [router]);

  return (
    <main className="min-h-screen">
      <div className="w-full p-4 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-bold">
          <a href="/" className="hover:text-primary">Macros</a>
        </h1>
        <div className="flex items-center gap-4">
          <AuthButton />
        </div>
      </div>
      <Hero />
    </main>
  );
}
