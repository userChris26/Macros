import { AuthButton } from "@/components/auth-button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      {children}
    </div>
  );
}
