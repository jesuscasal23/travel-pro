"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Shield, Thermometer, Backpack, Check } from "lucide-react";
import { generatePackingList } from "@/lib/utils/generate-packing-list";
import type { Itinerary } from "@/types";

interface EssentialsTabProps {
  itinerary: Itinerary;
}

export function EssentialsTab({ itinerary }: EssentialsTabProps) {
  const { route, days, visaData, weatherData } = itinerary;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const packingItems = useMemo(
    () => generatePackingList(weatherData, visaData, route, days),
    [weatherData, visaData, route, days]
  );

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group weather by country
  const countries = [...new Set(route.map((r) => r.country))];
  const countryWeather = countries.map((country) => {
    const countryRoute = route.filter((r) => r.country === country);
    const cities = weatherData.filter((w) =>
      countryRoute.some((r) => r.city === w.city)
    );
    const temps = cities.map((c) => {
      const match = c.temp.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const conditions = [...new Set(cities.map((c) => c.condition))];
    return {
      country,
      conditions: conditions.join(", "),
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
    };
  });

  return (
    <div className="space-y-10">
      {/* Visas */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">Visas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Always verify with official embassy sites before travel.
        </p>

        <div className="space-y-3">
          {visaData.map((visa) => (
            <div
              key={visa.countryCode}
              className="flex items-center justify-between p-4 bg-background border border-border rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-1 rounded">
                  {visa.countryCode}
                </span>
                <span className="font-semibold text-foreground">{visa.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  visa.requirement === "visa-free"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : visa.requirement === "e-visa" || visa.requirement === "eta"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                }`}>
                  {visa.requirement === "visa-free" && <Check className="w-3 h-3" />}
                  {visa.requirement !== "visa-free" && "⚠"}
                  {" "}{visa.label}
                </span>
                <a
                  href={visa.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Official site <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weather & Seasonality */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">Weather & Seasonality</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {countryWeather.map((cw) => (
            <div key={cw.country} className="bg-background border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground">{cw.country}</h3>
              <p className="text-sm text-muted-foreground mt-1">{cw.conditions}</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {cw.minTemp}–{cw.maxTemp}°C
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Smart Packing List */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-4">
          <Backpack className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">Smart Packing List</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {packingItems.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={checkedItems.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className={`text-sm ${
                checkedItems.has(item.id)
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
