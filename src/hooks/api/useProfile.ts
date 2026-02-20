import { useMutation } from "@tanstack/react-query";
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
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/profile/export");
      if (!res.ok) throw new Error("Export failed");
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
      const res = await fetch("/api/v1/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
  });
}
