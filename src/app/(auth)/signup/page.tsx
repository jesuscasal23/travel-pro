"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, LockKeyhole, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/v2/ui/Button";
import { queryKeys } from "@/hooks/api/keys";

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

const inputClass =
  "w-full rounded-[18px] border border-white/80 bg-white/92 px-4 py-3.5 text-sm text-v2-navy outline-none transition-colors placeholder:text-[#9aacbf] focus:border-brand-primary";
const labelClass = "mb-2 flex items-center gap-2 text-sm font-semibold text-v2-navy";
const errorClass = "mt-2 text-sm text-[#dc2626]";

function SignupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    const { data: signupData, error } = await supabase.auth.signUp({
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

    if (signupData.session) {
      queryClient.setQueryData(queryKeys.auth.status, true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
      router.replace(next);
      return;
    }

    // Email confirmation required — show check-inbox message
    setEmailSent(true);
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_18%,#f6f8fb_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,var(--brand-primary-glow)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pt-6 pb-8">
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

        <div className="flex flex-1 flex-col pt-4">
          <div className="bg-brand-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] shadow-[var(--shadow-brand-lg)]">
            {emailSent ? (
              <Mail className="h-8 w-8 text-white" strokeWidth={2.2} />
            ) : (
              <Sparkles className="h-8 w-8 text-white" strokeWidth={2.2} />
            )}
          </div>

          {emailSent ? (
            <div className="text-center">
              <h1 className="text-[1.7rem] font-bold tracking-[-0.04em] text-[#101114]">
                Check your inbox
              </h1>
              <p className="text-v2-text-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed">
                We sent a confirmation link to your email. Click it to activate your account and
                continue.
              </p>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-brand-primary mt-6 text-sm font-semibold"
              >
                Back to sign up
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
                  Travel Pro
                </p>
                <h1 className="mt-3 text-[2.15rem] leading-[1.02] font-bold tracking-[-0.05em] text-[#101114]">
                  Create your account
                </h1>
                <p className="text-v2-text-muted mt-2 text-sm leading-6">
                  Start planning smarter trips in minutes.
                </p>
              </div>

              <>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  autoComplete="on"
                  method="post"
                  className="mt-7 rounded-[30px] border border-white/80 bg-white/88 px-5 py-4 shadow-[0_24px_48px_rgba(27,43,75,0.06)] backdrop-blur-sm"
                >
                  <div className="space-y-4">
                    <GoogleAuthButton next={next} disabled={isLoading} onError={setServerError} />

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#dbe4f2]" />
                      <span className="text-[11px] font-bold tracking-[0.22em] text-[#9aacbf] uppercase">
                        Or with email
                      </span>
                      <div className="h-px flex-1 bg-[#dbe4f2]" />
                    </div>

                    <div>
                      <label htmlFor="signup-email" className={labelClass}>
                        <Mail className="h-4 w-4 text-[#8ea0bb]" />
                        Email address
                      </label>
                      <input
                        {...register("email")}
                        id="signup-email"
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                      {errors.email?.message && (
                        <p className={errorClass}>{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-password" className={labelClass}>
                        <LockKeyhole className="h-4 w-4 text-[#8ea0bb]" />
                        Password
                      </label>
                      <input
                        {...register("password")}
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className={inputClass}
                      />
                      {errors.password?.message && (
                        <p className={errorClass}>{errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-confirm-password" className={labelClass}>
                        <LockKeyhole className="h-4 w-4 text-[#8ea0bb]" />
                        Confirm password
                      </label>
                      <input
                        {...register("confirmPassword")}
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        className={inputClass}
                      />
                      {errors.confirmPassword?.message && (
                        <p className={errorClass}>{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    {serverError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm text-[#dc2626]">{serverError}</p>
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="!bg-brand-primary w-full py-3.5 shadow-[var(--shadow-brand-xl)] hover:brightness-105"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? "Creating account..." : "Create Account"}
                      </span>
                    </Button>
                  </div>
                </form>

                <p className="text-v2-text-muted pt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href={`/login${next !== "/trips" ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="text-brand-primary font-semibold transition-colors hover:brightness-95"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            </>
          )}
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
