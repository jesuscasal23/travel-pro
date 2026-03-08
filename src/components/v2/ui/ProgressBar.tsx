interface ProgressBarProps {
  progress: number; // 0-100
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="bg-v2-border h-1 w-full">
      <div
        className="bg-v2-navy h-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
