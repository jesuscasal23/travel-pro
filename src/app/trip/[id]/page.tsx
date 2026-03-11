import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function LegacyTripPage({ params }: { params: Params }) {
  const { id } = await params;
  redirect(`/trips/${id}`);
}
