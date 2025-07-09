'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProtectedRoute = pathname?.startsWith('/protected');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <main className="min-h-screen flex flex-col items-center">
            {isProtectedRoute && (
              <div className="w-full p-4 flex justify-between items-center max-w-7xl mx-auto">
                <h1 className="text-xl font-bold">
                  <a href="/" className="hover:text-primary">Macros</a>
                </h1>
                <div className="flex items-center gap-4">
                  <AuthButton />
                  <ThemeSwitcher />
                </div>
              </div>
            )}
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
