"use client";

import type { TripBudget } from "@/types";

interface BudgetBreakdownProps {
  budget: TripBudget | Record<string, number>;
  /** Show progress bars relative to total budget. */
  showProgressBars?: boolean;
  /** CSS class for the value text (default: "text-foreground"). */
  valueClassName?: string;
}

export function BudgetBreakdown({
  budget,
  showProgressBars,
  valueClassName = "text-foreground",
}: BudgetBreakdownProps) {
  const entries = (Object.entries(budget) as [string, number][]).filter(
    ([k]) => k !== "total" && k !== "budget"
  );

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className={showProgressBars ? "space-y-1" : ""}>
          <div className="flex justify-between text-sm">
            <span className="capitalize text-muted-foreground">{key}</span>
            <span className={`font-medium ${valueClassName}`}>
              &euro;{value.toLocaleString()}
            </span>
          </div>
          {showProgressBars && budget.budget > 0 && (
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(value / budget.budget) * 100}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
