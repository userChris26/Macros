"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Account Created!</CardTitle>
          <CardDescription className="text-center">
            Please verify your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p>
              We&apos;ve sent a verification link to your email address. Please check
              your inbox and click the link to verify your account.
            </p>
            <p className="text-sm text-muted-foreground">
              If you don&apos;t see the email, please check your spam folder.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
