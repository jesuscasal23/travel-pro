"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button, FormField } from "@/components/ui";
import { inputClass } from "@/components/auth/auth-styles";
import { ServerErrorAlert } from "@/components/auth/ServerErrorAlert";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;


export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();
    if (!supabase) { setServerError("Auth service unavailable."); setIsLoading(false); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={false} />
        <div className="max-w-md mx-auto px-4 pt-24 pb-12">
          <div className="card-travel p-8 text-center">
            <div className="text-4xl mb-4">&#x1F4E7;</div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Check your inbox
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              We sent a reset link to{" "}
              <strong>{getValues("email")}</strong>. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={false} />

      <div className="max-w-md mx-auto px-4 pt-24 pb-12">
        <div className="card-travel p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Reset your password
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your email and we&apos;ll send you a reset link.
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

            <ServerErrorAlert error={serverError} />

            <Button type="submit" loading={isLoading} className="w-full">
              Send reset link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
