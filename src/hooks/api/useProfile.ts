import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { apiFetch, ApiError } from "@/lib/client/api-fetch";
import type { TravelStyle, ActivityPace, UserProfile } from "@/types";

interface ProfileData {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace?: ActivityPace;
  onboardingCompleted?: boolean;
}

interface PersistedProfile extends UserProfile {
  id: string;
  userId: string;
  onboardingCompleted?: boolean;
  languagesSpoken?: string[];
}

async function fetchProfile(): Promise<PersistedProfile | null> {
  try {
    const data = await apiFetch<{ profile?: PersistedProfile }>("/api/v1/profile", {
      source: "useProfile",
      fallbackMessage: "Failed to load profile",
    });
    return data.profile ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
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
      const result = await apiFetch<{ profile?: PersistedProfile }>("/api/v1/profile", {
        source: "useSaveProfile",
        method: "PATCH",
        body: data,
        fallbackMessage: "Failed to save profile",
      });
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data.profile ?? null);
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const data = await apiFetch<Record<string, unknown>>("/api/v1/profile/export", {
        source: "useExportData",
        fallbackMessage: "Export failed",
      });
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
      return apiFetch<Record<string, unknown>>("/api/v1/profile", {
        source: "useDeleteAccount",
        method: "DELETE",
        fallbackMessage: "Failed to delete account",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile.detail(), null);
      queryClient.removeQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
