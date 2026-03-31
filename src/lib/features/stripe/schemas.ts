import { z } from "zod";

export const CheckoutInputSchema = z.object({
  plan: z.enum(["lifetime", "yearly", "monthly"]),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
