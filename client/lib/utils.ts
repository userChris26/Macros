import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl() {
  return process.env.NODE_ENV === 'production'
    ? 'http://cop4331iscool.xyz'
    : 'http://localhost:5000';
}

interface JWTPayload {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string | null;
  bio: string | null;
  iat?: number; // issued at timestamp
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    if (!token) return null;

    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Base64Url decode the payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Validate required fields
    if (!payload.userId || !payload.email) {
      console.error('Missing required fields in token payload');
      return null;
    }

    return {
      userId: payload.userId,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      email: payload.email,
      profilePic: payload.profilePic || null,
      bio: payload.bio || null,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}
