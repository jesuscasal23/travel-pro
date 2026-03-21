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
    <div className="bg-surface-soft mb-4 space-y-4 rounded-xl p-4">
      {/* Stops filter */}
      <div>
        <label className="text-muted-foreground mb-2 block text-[10px] font-bold tracking-widest uppercase">
          Stops
        </label>
        <div className="flex flex-wrap gap-2">
          {STOPS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={cooldown && opt.value !== stopsFilter}
              onClick={() => onStopsFilterChange(opt.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                stopsFilter === opt.value
                  ? "bg-primary font-bold text-white"
                  : "bg-card border-border text-foreground hover:border-primary/30 border shadow-sm"
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
          <div className="mb-2 flex items-center justify-between">
            <label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              Max price
            </label>
            <span className="font-display text-foreground text-sm font-bold">
              {maxPrice !== null
                ? `\u20AC${maxPrice.toLocaleString()}`
                : `\u20AC${priceRange.max.toLocaleString()}`}
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
          <div className="text-muted-foreground mt-1 flex justify-between text-[10px] font-medium">
            <span>&euro;{priceRange.min.toLocaleString()}</span>
            <span>&euro;{priceRange.max.toLocaleString()}</span>
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
