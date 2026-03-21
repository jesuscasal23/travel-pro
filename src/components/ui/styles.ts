/* ============================================================
   Shared class-name constants — single source of truth
   ============================================================ */

/** Glass-morphism input (v2 auth: login, signup) */
export const v2InputClass =
  "w-full rounded-[18px] border border-white/80 bg-white/92 px-4 py-3.5 text-sm text-v2-navy outline-none transition-colors placeholder:text-v2-input-placeholder focus:border-brand-primary";

/** Standard bordered input (plan forms, profile) */
export const travelInputClass =
  "border-v2-border focus:border-brand-primary focus:ring-0 text-v2-navy placeholder:text-v2-text-light w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";

/** V1 input (forgot-password, reset-password, combobox default) */
export const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-base";

export const v2LabelClass = "mb-2 flex items-center gap-2 text-sm font-semibold text-v2-navy";

export const travelFieldLabelClass = "text-v2-navy mb-2 block text-sm font-semibold";

export const v2ErrorClass = "mt-2 text-sm text-v2-error";

export const travelFieldErrorClass = "text-v2-red mt-2 text-sm";
