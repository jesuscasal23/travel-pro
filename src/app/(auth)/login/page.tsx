"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Compass, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/v2/ui/Button";
import { queryKeys } from "@/hooks/api/keys";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const inputClass =
  "w-full rounded-[18px] border border-white/80 bg-white/92 px-4 py-3.5 text-sm text-v2-navy outline-none transition-colors placeholder:text-[#9aacbf] focus:border-brand-primary";
const labelClass = "text-v2-navy mb-2 flex items-center gap-2 text-sm font-semibold";
const errorClass = "text-v2-red mt-2 text-sm";

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
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_18%,#f6f8fb_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,var(--brand-primary-glow)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pt-8 pb-10">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/92 text-[#8aa0c0] shadow-[0_12px_30px_rgba(27,43,75,0.08)] backdrop-blur-sm">
            <Link
              href={next}
              className="hover:text-v2-navy inline-flex items-center justify-center text-[#8aa0c0] transition-colors"
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
            <h1 className="mt-4 text-[2.35rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
              Welcome back
            </h1>
            <p className="text-v2-text-muted mt-3 text-sm leading-7">
              Sign in to pick up your saved trips, plans, and checklists.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
            method="post"
            className="mt-10 rounded-[30px] border border-white/80 bg-white/88 px-5 py-5 shadow-[0_24px_48px_rgba(27,43,75,0.06)] backdrop-blur-sm"
          >
            <div className="space-y-5">
              <GoogleAuthButton next={next} disabled={isLoading} onError={setServerError} />

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#dbe4f2]" />
                <span className="text-[11px] font-bold tracking-[0.22em] text-[#9aacbf] uppercase">
                  Or with email
                </span>
                <div className="h-px flex-1 bg-[#dbe4f2]" />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  <Mail className="h-4 w-4 text-[#8ea0bb]" />
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
                  className={inputClass}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email?.message && <p className={errorClass}>{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className={`${labelClass} mb-0`}>
                    <LockKeyhole className="h-4 w-4 text-[#8ea0bb]" />
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

              <Button
                type="submit"
                disabled={isLoading}
                className="!bg-brand-primary mt-2 py-4 shadow-[var(--shadow-brand-xl)] hover:brightness-105"
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
