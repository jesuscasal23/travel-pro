import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/helpers";
import { listCities } from "@/lib/features/cities/city-service";

export const GET = apiHandler("GET /api/v1/places/cities", async () => {
  const cities = await listCities();
  return NextResponse.json({ cities });
});
