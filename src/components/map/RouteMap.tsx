"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CityStop } from "@/types";

interface RouteMapProps {
  cities: CityStop[];
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
}

// MapLibre demo tiles — free, no API key required
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function RouteMap({ cities, activeCityIndex, onCityClick }: RouteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);

  // Build GeoJSON line through all cities
  const geojsonLine = {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: cities.map((c) => [c.lng, c.lat] as [number, number]),
    },
    properties: {},
  };

  // Auto-fit bounds when map loads
  const handleLoad = useCallback(() => {
    if (!mapRef.current || cities.length === 0) return;
    if (cities.length === 1) {
      // Single city — center on it at neighborhood zoom level
      mapRef.current.flyTo({
        center: [cities[0].lng, cities[0].lat],
        zoom: 11,
        duration: 1000,
      });
      return;
    }
    const lngs = cities.map((c) => c.lng);
    const lats = cities.map((c) => c.lat);
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 1000 }
    );
  }, [cities]);

  // Fly to active city when activeCityIndex changes
  useEffect(() => {
    if (activeCityIndex === null || !mapRef.current) return;
    const city = cities[activeCityIndex];
    if (!city) return;
    mapRef.current.flyTo({
      center: [city.lng, city.lat],
      zoom: 8,
      duration: 800,
    });
  }, [activeCityIndex, cities]);

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ height: "100%" }}
      role="region"
      aria-label={`Route map showing ${cities.length} ${cities.length === 1 ? "city" : "cities"}: ${cities.map((c) => c.city).join(", ")}`}
    >
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{
          longitude: 115,
          latitude: 20,
          zoom: 3,
        }}
        onLoad={handleLoad}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Dashed route line */}
        {cities.length >= 2 && (
          <Source id="route" type="geojson" data={geojsonLine}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#0D7377",
                "line-width": 2,
                "line-dasharray": [2, 2],
                "line-opacity": 0.6,
              }}
            />
          </Source>
        )}

        {/* Numbered city markers */}
        {cities.map((city, i) => {
          const isActive = activeCityIndex === i;
          return (
            <Marker
              key={city.id}
              longitude={city.lng}
              latitude={city.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onCityClick(i);
                setPopupIndex(i);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`${city.city}, ${city.country} — ${city.days} days${isActive ? " (selected)" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCityClick(i);
                    setPopupIndex(i);
                  }
                }}
                style={{
                  width: isActive ? 40 : 32,
                  height: isActive ? 40 : 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: isActive ? 14 : 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  outline: isActive ? "3px solid rgba(13,115,119,0.35)" : "none",
                  outlineOffset: "2px",
                  boxShadow: isActive
                    ? "0 0 0 2px #fff, 0 0 0 4px #0D7377"
                    : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {cities.length === 1 ? "📍" : i + 1}
              </div>
            </Marker>
          );
        })}

        {/* City popup */}
        {popupIndex !== null && cities[popupIndex] && (
          <Popup
            longitude={cities[popupIndex].lng}
            latitude={cities[popupIndex].lat}
            anchor="top"
            onClose={() => setPopupIndex(null)}
            closeButton
            closeOnClick={false}
            offset={24}
          >
            <div style={{ padding: "4px 2px", minWidth: 100 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--foreground))" }}>
                {cities[popupIndex].city}
              </div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                {cities[popupIndex].country}
              </div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                {cities[popupIndex].days} days
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
