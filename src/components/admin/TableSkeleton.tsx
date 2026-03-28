interface TableSkeletonProps {
  rows: number;
  cols: number;
}

export function TableSkeleton({ rows, cols }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 px-4 py-3 dark:bg-gray-800">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
