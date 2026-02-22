import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function EditRedirectPage({ params }: { params: Params }) {
  const { id } = await params;
  redirect(`/trip/${id}`);
}
