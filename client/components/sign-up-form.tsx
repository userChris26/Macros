"use client";

import { cn } from "@/lib/utils";
import { register } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  text: string;
  validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    text: "At least 8 characters long",
    validator: (password: string) => password.length >= 8,
  },
  {
    text: "Contains at least one uppercase letter",
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    text: "Contains at least one lowercase letter",
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    text: "Contains at least one number",
    validator: (password: string) => /[0-9]/.test(password),
  },
  {
    text: "Contains at least one special character",
    validator: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState<boolean[]>(
    new Array(passwordRequirements.length).fill(false)
  );
  const router = useRouter();

  // Check password requirements on every keystroke
  useEffect(() => {
    const newRequirements = passwordRequirements.map((req) =>
      req.validator(password)
    );
    setRequirements(newRequirements);
  }, [password]);

  // Check if all password requirements are met
  const isPasswordValid = requirements.every((req) => req);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(firstName, lastName, email, password);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      // Redirect to success page on successful registration
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-2 space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={req.text}
                      className="flex items-center gap-2 text-sm"
                    >
                      {requirements[index] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={cn(
                          requirements[index]
                            ? "text-green-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
                {repeatPassword && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    {password === repeatPassword ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isPasswordValid || password !== repeatPassword}
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
