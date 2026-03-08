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

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();
    if (!supabase) {
      setServerError("Auth service unavailable.");
      setIsLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    router.push(next);
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={false} />

      <div className="mx-auto max-w-md px-4 pt-24 pb-12">
        <div className="card-travel p-8">
          <h1 className="text-foreground mb-2 text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Start planning smarter trips in minutes.
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

            <FormField label="Password" error={errors.password?.message}>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </FormField>

            <FormField label="Confirm password" error={errors.confirmPassword?.message}>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={inputClass}
              />
            </FormField>

            <ServerErrorAlert error={serverError} />

            <Button type="submit" loading={isLoading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href={`/login${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
