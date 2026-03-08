"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button, FormField } from "@/components/ui";
import { inputClass } from "@/components/auth/auth-styles";
import { ServerErrorAlert } from "@/components/auth/ServerErrorAlert";

const resetSchema = z
  .object({
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

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();
    if (!supabase) {
      setServerError("Auth service unavailable.");
      setIsLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/home");
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={false} />

      <div className="mx-auto max-w-md px-4 pt-24 pb-12">
        <div className="card-travel p-8">
          <h1 className="text-foreground mb-2 text-2xl font-bold">Set new password</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="New password" error={errors.password?.message}>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </FormField>

            <FormField label="Confirm new password" error={errors.confirmPassword?.message}>
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
              Update password
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
