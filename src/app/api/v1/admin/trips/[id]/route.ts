import { NextRequest, NextResponse } from "next/server";
import { apiHandler, requireSuperUser } from "@/lib/api/helpers";
import { deleteTripById } from "@/lib/features/trips/trip-collection-service";

export const DELETE = apiHandler(
  "DELETE /api/v1/admin/trips/:id",
  async (_req: NextRequest, params) => {
    await requireSuperUser();

    return NextResponse.json(await deleteTripById(params.id));
  }
);
