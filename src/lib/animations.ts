import type { Variants } from "framer-motion";

/** Slide transition for multi-step forms (onboarding, plan questionnaire) */
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};
