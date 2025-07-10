import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl() {
  return process.env.NODE_ENV === 'production'
    ? 'http://64.225.3.4:5000'
    : 'http://localhost:5000';
}
