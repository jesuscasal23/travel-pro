"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Compass, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/core/supabase-client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { glassInputClass, glassLabelClass, formErrorClass } from "@/components/ui/styles";
import { Button } from "@/components/ui/Button";
import { queryKeys } from "@/hooks/api/keys";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";
  const callbackError = searchParams.get("error");
  const [serverError, setServerError] = useState<string | null>(callbackError);
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

    queryClient.setQueryData(queryKeys.auth.status, true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
    router.replace(next);
    router.refresh();
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[image:var(--gradient-page)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[image:var(--glow-top)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[image:var(--glow-bottom)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pt-8 pb-10">
        <div className="flex items-center">
          <div className="text-back-btn shadow-back-btn flex h-12 w-12 items-center justify-center rounded-2xl bg-white/92 backdrop-blur-sm">
            <Link
              href={next}
              className="hover:text-navy text-back-btn inline-flex items-center justify-center transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="bg-brand-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] shadow-[var(--shadow-brand-lg)]">
            <Compass className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>

          <div className="text-center">
            <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
              Travel Pro
            </p>
            <h1 className="text-ink mt-4 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em]">
              Welcome back
            </h1>
            <p className="text-dim mt-3 text-sm leading-7">
              Sign in to pick up your saved trips, plans, and checklists.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
            method="post"
            className="shadow-glass-xl mt-10 rounded-[30px] border border-white/80 bg-white/88 px-5 py-5 backdrop-blur-sm"
          >
            <div className="space-y-5">
              <GoogleAuthButton next={next} disabled={isLoading} onError={setServerError} />

              <div className="flex items-center gap-3">
                <div className="bg-divider h-px flex-1" />
                <span className="text-subtext text-[11px] font-bold tracking-[0.22em] uppercase">
                  Or with email
                </span>
                <div className="bg-divider h-px flex-1" />
              </div>

              <div>
                <label htmlFor="email" className={glassLabelClass}>
                  <Mail className="text-label h-4 w-4" />
                  Email address
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="you@example.com"
                  className={glassInputClass}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email?.message && <p className={formErrorClass}>{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className={`${glassLabelClass} mb-0`}>
                    <LockKeyhole className="text-label h-4 w-4" />
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-brand-primary text-sm font-semibold transition-colors hover:brightness-95"
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
                  className={glassInputClass}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password?.message && (
                  <p className={formErrorClass}>{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-app-red text-sm">{serverError}</p>
                </div>
              )}

              <Button
                variant="brand"
                fullWidth
                type="submit"
                disabled={isLoading}
                className="shadow-brand-xl mt-2"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </span>
              </Button>
            </div>
          </form>
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
