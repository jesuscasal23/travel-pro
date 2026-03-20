import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api-fetch";

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
