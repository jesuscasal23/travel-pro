import { FeedbackPageClient } from "@/components/feedback/FeedbackPageClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function FeedbackPage() {
  await requirePageAuth("/feedback");

  return <FeedbackPageClient />;
}
