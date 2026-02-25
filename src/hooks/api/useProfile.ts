import { useMutation } from "@tanstack/react-query";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
import type { TravelStyle } from "@/types";

interface ProfileData {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
}

export function useSaveProfile() {
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
          message: error instanceof Error ? error.message : "Network error while exporting profile data",
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
  });
}
