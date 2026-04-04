import {
  getHotelSelectionsForTrip,
  upsertHotelSelection,
  removeHotelSelection,
  markHotelBooked,
} from "@/lib/features/selections/selection-service";
import { UpsertHotelSelectionSchema } from "@/lib/features/selections/schemas";
import { createSelectionRoutes } from "@/lib/features/selections/selection-route";

export const dynamic = "force-dynamic";

const routes = createSelectionRoutes({
  kind: "hotels",
  upsertSchema: UpsertHotelSelectionSchema,
  listSelections: getHotelSelectionsForTrip,
  upsertSelection: upsertHotelSelection,
  removeSelection: removeHotelSelection,
  markSelectionBooked: markHotelBooked,
});

export const { GET, PUT, DELETE, PATCH } = routes;
