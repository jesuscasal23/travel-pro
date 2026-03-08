"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button, FormField } from "@/components/ui";
import { inputClass } from "@/components/auth/auth-styles";
import { ServerErrorAlert } from "@/components/auth/ServerErrorAlert";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();
    if (!supabase) {
      setServerError("Auth service unavailable.");
      setIsLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={false} />

      <div className="mx-auto max-w-md px-4 pt-24 pb-12">
        <div className="card-travel p-8">
          <h1 className="text-foreground mb-2 text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Sign in to continue planning your next adventure.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Email address" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Password"
              error={errors.password?.message}
              labelSuffix={
                <Link
                  href="/forgot-password"
                  className="text-primary float-right font-normal hover:underline"
                >
                  Forgot password?
                </Link>
              }
            >
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                className={inputClass}
              />
            </FormField>

            <ServerErrorAlert error={serverError} />

            <Button type="submit" loading={isLoading} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
