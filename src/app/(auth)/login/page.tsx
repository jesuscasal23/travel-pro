"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Compass, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/v2/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const inputClass =
  "border-v2-border focus:border-v2-orange text-v2-navy placeholder:text-v2-text-light w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition-colors";
const labelClass = "text-v2-navy mb-2 flex items-center gap-2 text-sm font-semibold";
const errorClass = "text-v2-red mt-2 text-sm";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";
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
    <div className="flex min-h-dvh justify-center bg-gray-100">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_60%)]" />

        <div className="relative flex flex-1 flex-col px-6 pt-8 pb-10">
          <div className="flex items-center justify-between">
            <Link
              href="/trips"
              className="text-v2-text-muted hover:text-v2-navy inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <span className="bg-v2-chip-bg text-v2-navy rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.18em] uppercase">
              Travel Pro
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 shadow-[0_14px_32px_rgba(249,115,22,0.18)]">
              <Compass className="text-v2-orange h-10 w-10" strokeWidth={2.2} />
            </div>

            <div className="text-center">
              <h1 className="text-v2-navy text-3xl leading-tight font-bold">Welcome back</h1>
              <p className="text-v2-text-muted mt-3 text-sm">
                Sign in to pick up your saved trips, plans, and checklists.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>
                  <Mail className="text-v2-text-muted h-4 w-4" />
                  Email address
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email?.message && <p className={errorClass}>{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className={`${labelClass} mb-0`}>
                    <LockKeyhole className="text-v2-text-muted h-4 w-4" />
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-v2-orange text-sm font-semibold transition-colors hover:brightness-95"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  {...register("password")}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={inputClass}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password?.message && (
                  <p className={errorClass}>{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-v2-red text-sm">{serverError}</p>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="mt-2">
                <span className="flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Signing in..." : "SIGN IN"}
                </span>
              </Button>
            </form>
          </div>

          <div className="space-y-3 pt-6 text-center">
            <p className="text-v2-text-muted text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup${next !== "/trips" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-v2-orange font-semibold transition-colors hover:brightness-95"
              >
                Sign up
              </Link>
            </p>
            <p className="text-v2-text-light text-xs">
              By signing in you can sync your plans across devices.
            </p>
          </div>
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
