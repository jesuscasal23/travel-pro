"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { deriveCityBudgets } from "@/lib/utils/derive-city-budget";
import type { TripBudget, CityStop, TripDay } from "@/types";

interface BudgetTabProps {
  budget: TripBudget;
  route: CityStop[];
  days: TripDay[];
}

const CATEGORY_COLORS: Record<string, string> = {
  flights: "#0D7377",
  accommodation: "#4DB8A4",
  food: "#F59E0B",
  activities: "#E85D4A",
  transport: "#6B7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  flights: "Flights",
  accommodation: "Stays",
  food: "Food",
  activities: "Activities",
  transport: "Transport",
};

type AdjustMode = null | "tighten" | "upgrade";

function adjustBudget(budget: TripBudget, mode: AdjustMode): TripBudget {
  if (mode === "tighten") {
    return {
      ...budget,
      flights: Math.round(budget.flights * 0.9),
      accommodation: Math.round(budget.accommodation * 0.9),
      activities: Math.round(budget.activities * 0.9),
      food: Math.round(budget.food * 0.9),
      transport: Math.round(budget.transport * 0.9),
      total: Math.round(budget.total * 0.9),
    };
  }
  if (mode === "upgrade") {
    const diff = Math.round(budget.accommodation * 0.3);
    return {
      ...budget,
      accommodation: budget.accommodation + diff,
      total: budget.total + diff,
    };
  }
  return budget;
}

export function BudgetTab({ budget: originalBudget, route, days }: BudgetTabProps) {
  const [adjustMode, setAdjustMode] = useState<AdjustMode>(null);
  const budget = adjustBudget(originalBudget, adjustMode);
  const overUnder = budget.total - budget.budget;

  const cityBudgets = useMemo(
    () => deriveCityBudgets(route, days, budget),
    [route, days, budget]
  );

  // Categories for the stacked bar
  const categories = (["flights", "accommodation", "food", "activities", "transport"] as const).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    value: budget[key],
    color: CATEGORY_COLORS[key],
    percent: budget.total > 0 ? (budget[key] / budget.total) * 100 : 0,
  }));

  // Remaining "other" amount
  const knownTotal = categories.reduce((sum, c) => sum + c.value, 0);
  const other = Math.max(0, budget.total - knownTotal);
  if (other > 0) {
    categories.push({
      key: "other" as never,
      label: "Other",
      value: other,
      color: "#D1D5DB",
      percent: (other / budget.total) * 100,
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero total card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background border border-border rounded-xl p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">Estimated total</p>
        <p className="text-5xl font-bold text-foreground mt-1">
          €{budget.total.toLocaleString()}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-sm text-primary font-medium">
            Your budget: €{budget.budget.toLocaleString()}
          </span>
          {overUnder !== 0 && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              overUnder > 0
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
            }`}>
              €{Math.abs(overUnder).toLocaleString()} {overUnder > 0 ? "over" : "under"}
            </span>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-4">
          {adjustMode === null ? (
            <>
              <button
                onClick={() => setAdjustMode("tighten")}
                className="btn-ghost text-xs py-2 px-4"
              >
                Tighten budget by 10%
              </button>
              <button
                onClick={() => setAdjustMode("upgrade")}
                className="btn-ghost text-xs py-2 px-4"
              >
                Upgrade stays
              </button>
            </>
          ) : (
            <button
              onClick={() => setAdjustMode(null)}
              className="btn-ghost text-xs py-2 px-4"
            >
              Reset to original
            </button>
          )}
        </div>
      </motion.div>

      {/* Category breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-semibold text-foreground mb-3">Category breakdown</h3>

        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden">
          {categories.map((cat) => (
            <div
              key={cat.key}
              style={{ width: `${Math.max(cat.percent, 1)}%`, backgroundColor: cat.color }}
              className="transition-all duration-300"
              title={`${cat.label}: €${cat.value.toLocaleString()}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-semibold text-foreground">€{cat.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* By city table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="font-semibold text-foreground mb-3">By city</h3>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left px-4 py-3 font-medium text-foreground">City</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">Stays</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">Activities</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">Food</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">Transport</th>
                <th className="text-right px-4 py-3 font-medium text-primary">Total</th>
              </tr>
            </thead>
            <tbody>
              {cityBudgets.map((row) => (
                <tr key={row.city} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{row.city}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">€{row.stays.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">€{row.activities.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">€{row.food.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">€{row.transport.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">€{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
