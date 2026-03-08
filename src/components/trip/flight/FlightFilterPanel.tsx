"use client";

export type StopsFilter = "any" | "nonstop" | "1stop" | "2plus";

const STOPS_OPTIONS: { value: StopsFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "nonstop", label: "Nonstop" },
  { value: "1stop", label: "1 stop" },
  { value: "2plus", label: "2+" },
];

export function matchesStopsFilter(stops: number, filter: StopsFilter): boolean {
  switch (filter) {
    case "nonstop":
      return stops === 0;
    case "1stop":
      return stops <= 1;
    case "2plus":
      return true;
    default:
      return true;
  }
}

interface FlightFilterPanelProps {
  stopsFilter: StopsFilter;
  maxPrice: number | null;
  priceRange: { min: number; max: number };
  cooldown: boolean;
  activeFilterCount: number;
  onStopsFilterChange: (filter: StopsFilter) => void;
  onMaxPriceChange: (price: number | null) => void;
  onMaxPriceCommit: (price: number | null) => void;
  onClearFilters: () => void;
}

export function FlightFilterPanel({
  stopsFilter,
  maxPrice,
  priceRange,
  cooldown,
  activeFilterCount,
  onStopsFilterChange,
  onMaxPriceChange,
  onMaxPriceCommit,
  onClearFilters,
}: FlightFilterPanelProps) {
  return (
    <div className="border-border bg-background mb-3 space-y-3 rounded-lg border p-3">
      {/* Stops filter */}
      <div>
        <label className="text-muted-foreground mb-1.5 block text-xs font-medium">Stops</label>
        <div className="flex flex-wrap gap-1.5">
          {STOPS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={cooldown && opt.value !== stopsFilter}
              onClick={() => onStopsFilterChange(opt.value)}
              className={`rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                stopsFilter === opt.value
                  ? "bg-primary font-medium text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Max price filter */}
      {priceRange.min < priceRange.max && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-medium">Max price</label>
            <span className="text-foreground text-xs font-medium">
              {maxPrice !== null
                ? `€${maxPrice.toLocaleString()}`
                : `€${priceRange.max.toLocaleString()}`}
            </span>
          </div>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={maxPrice ?? priceRange.max}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onMaxPriceChange(val >= priceRange.max ? null : val);
            }}
            onMouseUp={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onMaxPriceCommit(val >= priceRange.max ? null : val);
            }}
            onTouchEnd={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onMaxPriceCommit(val >= priceRange.max ? null : val);
            }}
            className="accent-primary w-full"
          />
          <div className="text-muted-foreground mt-0.5 flex justify-between text-[10px]">
            <span>€{priceRange.min.toLocaleString()}</span>
            <span>€{priceRange.max.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearFilters}
          className="text-primary text-xs font-medium hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
