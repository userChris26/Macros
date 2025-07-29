'use client';

import { ThemeProvider } from "next-themes";
import { Toaster } from 'sonner';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      {children}
      <Toaster richColors />
    </ThemeProvider>
  );
} 