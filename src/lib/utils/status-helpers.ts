export function statusBadge(status: string): string {
  if (status === "complete") return "badge-success";
  if (status === "generating") return "badge-warning";
  if (status === "failed") return "badge-info";
  return "badge-info";
}

export function statusLabel(status: string): string {
  if (status === "complete") return "Ready";
  if (status === "generating") return "Generating...";
  if (status === "failed") return "Failed";
  return "Planning";
}
