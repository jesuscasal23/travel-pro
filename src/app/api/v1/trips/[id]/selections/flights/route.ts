import {
  getFlightSelectionsForTrip,
  upsertFlightSelection,
  removeFlightSelection,
  markFlightBooked,
} from "@/lib/features/selections/selection-service";
import { UpsertFlightSelectionSchema } from "@/lib/features/selections/schemas";
import { createSelectionRoutes } from "@/lib/features/selections/selection-route";

export const dynamic = "force-dynamic";

const routes = createSelectionRoutes({
  kind: "flights",
  upsertSchema: UpsertFlightSelectionSchema,
  listSelections: getFlightSelectionsForTrip,
  upsertSelection: upsertFlightSelection,
  removeSelection: removeFlightSelection,
  markSelectionBooked: markFlightBooked,
});

export const { GET, PUT, DELETE, PATCH } = routes;
