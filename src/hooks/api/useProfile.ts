import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
import { queryKeys } from "./keys";
import type { TravelStyle, ActivityPace, UserProfile } from "@/types";

interface ProfileData {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace?: ActivityPace;
  onboardingCompleted?: boolean;
}

export interface PersistedProfile extends UserProfile {
  id: string;
  userId: string;
  onboardingCompleted?: boolean;
  languagesSpoken?: string[];
}

async function fetchProfile(): Promise<PersistedProfile | null> {
  const endpoint = "/api/v1/profile";
  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch (error) {
    await reportApiError({
      source: "useProfile",
      endpoint,
      method: "GET",
      message: error instanceof Error ? error.message : "Network error while loading profile",
    });
    throw new Error("Failed to load profile");
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const parsed = await parseApiErrorResponse(res, "Failed to load profile");
    await reportApiError({
      source: "useProfile",
      endpoint,
      method: "GET",
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new Error(parsed.message);
  }

  const data = await res.json();
  return data.profile ?? null;
}

export function useProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: fetchProfile,
    enabled: options?.enabled ?? true,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileData) => {
      const endpoint = "/api/v1/profile";
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error) {
        await reportApiError({
          source: "useSaveProfile",
          endpoint,
          method: "PATCH",
          message: error instanceof Error ? error.message : "Network error while saving profile",
        });
        throw new Error("Failed to save profile");
      }
      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Failed to save profile");
        await reportApiError({
          source: "useSaveProfile",
          endpoint,
          method: "PATCH",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data.profile ?? null);
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const endpoint = "/api/v1/profile/export";
      let res: Response;
      try {
        res = await fetch(endpoint);
      } catch (error) {
        await reportApiError({
          source: "useExportData",
          endpoint,
          method: "GET",
          message:
            error instanceof Error ? error.message : "Network error while exporting profile data",
        });
        throw new Error("Export failed");
      }
      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Export failed");
        await reportApiError({
          source: "useExportData",
          endpoint,
          method: "GET",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "travel-pro-data.json";
      a.click();
      URL.revokeObjectURL(url);
      return data;
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const endpoint = "/api/v1/profile";
      let res: Response;
      try {
        res = await fetch(endpoint, { method: "DELETE" });
      } catch (error) {
        await reportApiError({
          source: "useDeleteAccount",
          endpoint,
          method: "DELETE",
          message: error instanceof Error ? error.message : "Network error while deleting account",
        });
        throw new Error("Failed to delete account");
      }
      if (!res.ok) {
        const parsed = await parseApiErrorResponse(res, "Failed to delete account");
        await reportApiError({
          source: "useDeleteAccount",
          endpoint,
          method: "DELETE",
          message: parsed.message,
          status: parsed.status,
          requestId: parsed.requestId,
          responseBody: parsed.responseBody,
        });
        throw new Error(parsed.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile.detail(), null);
      queryClient.removeQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
