interface StatusDotProps {
  status: string;
}

export function StatusDot({ status }: StatusDotProps) {
  const color =
    status === "complete"
      ? "bg-green-400"
      : status === "failed"
        ? "bg-red-400"
        : status === "generating"
          ? "bg-blue-400"
          : "bg-gray-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
