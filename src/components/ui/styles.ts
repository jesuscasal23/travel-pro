/* ============================================================
   Shared class-name constants — single source of truth
   ============================================================ */

/** Glass-morphism input (login, signup) */
export const glassInputClass =
  "w-full rounded-[18px] border border-white/80 bg-white/92 px-4 py-3.5 text-sm text-navy outline-none transition-colors placeholder:text-input-placeholder focus:border-brand-primary";

/** Standard bordered input (plan forms, profile) */
export const travelInputClass =
  "border-edge focus:border-brand-primary focus:ring-0 text-navy placeholder:text-faint w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors";

/** Legacy input (forgot-password, reset-password, combobox default) */
export const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-base";

export const glassLabelClass = "mb-2 flex items-center gap-2 text-sm font-semibold text-navy";

export const travelFieldLabelClass = "text-navy mb-2 block text-sm font-semibold";

export const formErrorClass = "mt-2 text-sm text-error";

export const travelFieldErrorClass = "text-app-red mt-2 text-sm";
