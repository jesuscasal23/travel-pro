"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CityStop } from "@/types";
import { getCategoryStyle, getCategoryEmoji } from "@/lib/utils/format/category-colors";

export interface HotelPin {
  lat: number;
  lng: number;
  name: string;
  pricePerNight: number | null;
  rating: number | null;
  city: string;
}

export interface ActivityPin {
  lat: number;
  lng: number;
  name: string;
  category: string;
  duration: string;
  dayNumber: number;
  city: string;
}

interface RouteMapProps {
  cities: CityStop[];
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
  hotelPins?: HotelPin[];
  activityPins?: ActivityPin[];
}

// Carto Voyager — free, production-grade tiles, no API key required
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export default function RouteMap({
  cities,
  activeCityIndex,
  onCityClick,
  hotelPins = [],
  activityPins = [],
}: RouteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);
  const [hotelPopupIndex, setHotelPopupIndex] = useState<number | null>(null);
  const [activityPopupIndex, setActivityPopupIndex] = useState<number | null>(null);

  // Build GeoJSON line through all cities
  const geojsonLine = {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: cities.map((c) => [c.lng, c.lat] as [number, number]),
    },
    properties: {},
  };

  // Auto-fit bounds when map loads — include hotel pins in bounds
  const handleLoad = useCallback(() => {
    if (!mapRef.current || cities.length === 0) return;

    const allLngs = [
      ...cities.map((c) => c.lng),
      ...hotelPins.map((h) => h.lng),
      ...activityPins.map((a) => a.lng),
    ];
    const allLats = [
      ...cities.map((c) => c.lat),
      ...hotelPins.map((h) => h.lat),
      ...activityPins.map((a) => a.lat),
    ];

    if (cities.length === 1 && hotelPins.length === 0 && activityPins.length === 0) {
      // Single city, no hotels — center on it at neighborhood zoom level
      mapRef.current.flyTo({
        center: [cities[0].lng, cities[0].lat],
        zoom: 11,
        duration: 1000,
      });
      return;
    }

    mapRef.current.fitBounds(
      [
        [Math.min(...allLngs), Math.min(...allLats)],
        [Math.max(...allLngs), Math.max(...allLats)],
      ],
      { padding: 80, duration: 1000 }
    );
  }, [cities, hotelPins, activityPins]);

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
                setHotelPopupIndex(null);
                setActivityPopupIndex(null);
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
                    setHotelPopupIndex(null);
                    setActivityPopupIndex(null);
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

        {/* Hotel pins */}
        {hotelPins.map((hotel, i) => (
          <Marker
            key={`hotel-${hotel.city}-${hotel.name}`}
            longitude={hotel.lng}
            latitude={hotel.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setHotelPopupIndex(i);
              setPopupIndex(null);
              setActivityPopupIndex(null);
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={`Hotel: ${hotel.name} in ${hotel.city}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setHotelPopupIndex(i);
                  setPopupIndex(null);
                  setActivityPopupIndex(null);
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                border: "2px solid #fff",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
                <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                <path d="M2 20h20" />
                <path d="M6 10v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
          </Marker>
        ))}

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

        {/* Activity pins */}
        {activityPins.map((activity, i) => {
          const style = getCategoryStyle(activity.category);
          const emoji = getCategoryEmoji(activity.category);
          return (
            <Marker
              key={`activity-${activity.dayNumber}-${activity.name}`}
              longitude={activity.lng}
              latitude={activity.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setActivityPopupIndex(i);
                setPopupIndex(null);
                setHotelPopupIndex(null);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`Activity: ${activity.name} — Day ${activity.dayNumber}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivityPopupIndex(i);
                    setPopupIndex(null);
                    setHotelPopupIndex(null);
                  }
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: style.strokeHsl,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                  border: "2px solid #fff",
                }}
              >
                {emoji}
              </div>
            </Marker>
          );
        })}

        {/* Activity popup */}
        {activityPopupIndex !== null && activityPins[activityPopupIndex] && (
          <Popup
            longitude={activityPins[activityPopupIndex].lng}
            latitude={activityPins[activityPopupIndex].lat}
            anchor="top"
            onClose={() => setActivityPopupIndex(null)}
            closeButton
            closeOnClick={false}
            offset={16}
          >
            <div style={{ padding: "4px 2px", minWidth: 120 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--foreground))" }}>
                {getCategoryEmoji(activityPins[activityPopupIndex].category)}{" "}
                {activityPins[activityPopupIndex].name}
              </div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                Day {activityPins[activityPopupIndex].dayNumber} ·{" "}
                {activityPins[activityPopupIndex].duration}
              </div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                {activityPins[activityPopupIndex].city}
              </div>
            </div>
          </Popup>
        )}

        {/* Hotel popup */}
        {hotelPopupIndex !== null && hotelPins[hotelPopupIndex] && (
          <Popup
            longitude={hotelPins[hotelPopupIndex].lng}
            latitude={hotelPins[hotelPopupIndex].lat}
            anchor="top"
            onClose={() => setHotelPopupIndex(null)}
            closeButton
            closeOnClick={false}
            offset={24}
          >
            <div style={{ padding: "4px 2px", minWidth: 120 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--foreground))" }}>
                {hotelPins[hotelPopupIndex].name}
              </div>
              {hotelPins[hotelPopupIndex].pricePerNight != null && (
                <div style={{ fontSize: 12, color: "hsl(var(--foreground))", marginTop: 2 }}>
                  {hotelPins[hotelPopupIndex].pricePerNight}€/night
                </div>
              )}
              {hotelPins[hotelPopupIndex].rating != null && (
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                  {"★".repeat(Math.round(hotelPins[hotelPopupIndex].rating!))}{" "}
                  {hotelPins[hotelPopupIndex].rating} stars
                </div>
              )}
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                {hotelPins[hotelPopupIndex].city}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
