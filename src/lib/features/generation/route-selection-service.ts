import Anthropic from "@anthropic-ai/sdk";
import { selectRoute } from "@/lib/ai/prompts/route-selector";
import { ApiError } from "@/lib/api/errors";
import { getAnthropicApiKey } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";
import { throwIfAborted } from "@/lib/core/abort";
import { z } from "zod";
import { buildSingleCitySelection } from "./select-route-transform";
import { SelectRouteInputSchema } from "./schemas";

const log = createLogger("route-selection-service");

export type SelectRouteInput = z.infer<typeof SelectRouteInputSchema>;

export async function selectRouteCandidates(
  input: SelectRouteInput,
  signal?: AbortSignal
): Promise<{ cities: Awaited<ReturnType<typeof selectRoute>> | null }> {
  const singleCitySelection = buildSingleCitySelection(input.tripIntent);
  if (singleCitySelection) {
    return { cities: singleCitySelection };
  }

  const apiKey = getAnthropicApiKey();

  try {
    const anthropic = new Anthropic({ apiKey });
    const cities = await selectRoute(input.profile, input.tripIntent, anthropic, signal);
    throwIfAborted(signal);
    return { cities };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    log.warn("Route selection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { cities: null };
  }
}
