"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a JWT token in cookies
    const token = Cookies.get('jwtToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Remove the JWT cookie
      Cookies.remove('jwtToken', { path: '/' });
      
      // Clear any other auth-related cookies if they exist
      Cookies.remove('userId', { path: '/' });
      Cookies.remove('firstName', { path: '/' });
      Cookies.remove('lastName', { path: '/' });
      
      // Update state
      setIsLoggedIn(false);
      
      // Force a hard refresh to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {isLoggedIn ? (
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="hover:bg-destructive hover:text-destructive-foreground"
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      ) : (
        <>
          <Link href="/auth/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </>
      )}
    </div>
  );
}
