"use client";

import type { CityStop } from "@/types";

interface RouteMapFallbackProps {
  cities: CityStop[];
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
}

// Use CSS variable so SVG colors adapt to dark mode
const PRIMARY = "hsl(var(--primary))";
const PRIMARY_FG = "hsl(var(--primary-foreground))";

export default function RouteMapFallback({
  cities,
  activeCityIndex,
  onCityClick,
}: RouteMapFallbackProps) {
  if (cities.length === 0) return null;

  const svgWidth = 400;
  const svgHeight = 260;
  const padding = 44;

  const lngs = cities.map((c) => c.lng);
  const lats = cities.map((c) => c.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngRange = maxLng - minLng || 1;
  const latRange = maxLat - minLat || 1;

  const toX = (lng: number) =>
    padding + ((lng - minLng) / lngRange) * (svgWidth - 2 * padding);
  const toY = (lat: number) =>
    padding + (1 - (lat - minLat) / latRange) * (svgHeight - 2 * padding);

  const points = cities.map((c) => ({ x: toX(c.lng), y: toY(c.lat) }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="rounded-xl overflow-hidden bg-sky-50 dark:bg-sky-950 border border-border" style={{ height: "360px" }}>
      <div className="h-full flex flex-col items-center justify-center p-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-sm"
          style={{ maxHeight: "240px" }}
        >
          {/* Dashed route line */}
          <polyline
            points={polylinePoints}
            fill="none"
            style={{ stroke: PRIMARY }}
            strokeWidth="1.5"
            strokeDasharray="5,4"
            strokeOpacity="0.6"
            strokeLinejoin="round"
          />

          {/* City markers */}
          {points.map((p, i) => {
            const city = cities[i];
            const isActive = activeCityIndex === i;
            return (
              <g
                key={city.id}
                onClick={() => onCityClick(i)}
                style={{ cursor: "pointer" }}
              >
                {/* Active ring */}
                {isActive && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={16}
                    fill="none"
                    style={{ stroke: PRIMARY }}
                    strokeWidth="2"
                    strokeOpacity="0.4"
                  />
                )}
                {/* Marker circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 13 : 11}
                  style={{ fill: PRIMARY }}
                  className="transition-all duration-200"
                />
                {/* Number */}
                <text
                  x={p.x}
                  y={p.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fill: PRIMARY_FG }}
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                >
                  {i + 1}
                </text>
                {/* City label */}
                <text
                  x={p.x}
                  y={p.y + 20}
                  textAnchor="middle"
                  style={{ fill: PRIMARY }}
                  fontSize="7.5"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {city.city}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="text-xs text-muted-foreground mt-2">
          {cities.length} cities · {cities.reduce((s, c) => s + c.days, 0)} days
        </p>
      </div>
    </div>
  );
}
