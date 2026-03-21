import { TripClientProvider } from "@/components/trip/TripClientProvider";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export default async function TripDetailsLayout({ params, children }: Props) {
  const { id } = await params;

  return <TripClientProvider tripId={id}>{children}</TripClientProvider>;
}
