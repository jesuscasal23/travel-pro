"use client";

import { type ReactNode } from "react";

const labelClass = "block text-sm font-medium text-foreground mb-2";
const errorClass = "mt-1 text-sm text-red-500 dark:text-red-400";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
  /** Extra content to float-right inside the label (e.g. "Forgot password?" link) */
  labelSuffix?: ReactNode;
}

export function FormField({ label, error, children, className = "", labelSuffix }: FormFieldProps) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label}
        {labelSuffix}
      </label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
