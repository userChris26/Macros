import { AuthButton } from "@/components/auth-button";
import { Sidebar } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r">
        <div className="flex h-14 items-center border-b px-4 py-2">
          <h1 className="text-xl font-bold">Macros</h1>
        </div>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex h-14 items-center gap-4 border-b px-4 py-2">
          <div className="flex-1" />
          <AuthButton />
        </header>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
