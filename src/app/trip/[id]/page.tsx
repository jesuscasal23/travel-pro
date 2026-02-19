"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Edit3, LayoutList, Loader2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useTripStore } from "@/stores/useTripStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { ItineraryTab } from "@/components/trip/plan-view/ItineraryTab";
import { EssentialsTab } from "@/components/trip/plan-view/EssentialsTab";
import { BudgetTab } from "@/components/trip/plan-view/BudgetTab";
import type { VisaInfo, CityWeather, Itinerary, CityStop } from "@/types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-150 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
      Loading map…
    </div>
  ),
});

type Tab = "itinerary" | "essentials" | "budget" | "map";

const TAB_LABELS: Record<Tab, string> = {
  itinerary: "Itinerary",
  essentials: "Essentials",
  budget: "Budget",
  map: "Map",
};

type Params = Promise<{ id: string }>;

export default function TripPage({ params }: { params: Params }) {
  const { id } = use(params);
  const itinerary = useItinerary();
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];

  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const dateStart = useTripStore((s) => s.dateStart);
  const setItinerary = useTripStore((s) => s.setItinerary);

  // ── Detect partial itinerary (no days yet — generation needed) ──────────────
  const isPartialItinerary = !!(itinerary && itinerary.days.length === 0 && id !== "guest");
  const bgGenRef = useRef(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Switch to Map tab automatically when arriving with route but no days
  useEffect(() => {
    if (isPartialItinerary && itinerary?.route.length && activeTab === "itinerary") {
      setActiveTab("map");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialItinerary]);

  // Fire background generation via SSE when we have a partial itinerary
  useEffect(() => {
    if (!isPartialItinerary || bgGenRef.current) return;
    bgGenRef.current = true;
    setGenerationError(null);

    const profile = { nationality, homeAirport, travelStyle, interests };

    // Convert route to cities format for the generate endpoint (if route exists)
    const cities = itinerary!.route.length > 0
      ? itinerary!.route.map((r) => ({
          id: r.id,
          city: r.city,
          country: r.country,
          countryCode: r.countryCode,
          iataCode: r.iataCode ?? "",
          lat: r.lat,
          lng: r.lng,
          minDays: r.days,
          maxDays: r.days,
        }))
      : undefined;

    const generate = async () => {
      try {
        const genRes = await fetch(`/api/v1/trips/${id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, promptVersion: "v1", ...(cities ? { cities } : {}) }),
        });

        if (genRes.ok && genRes.body) {
          const reader = genRes.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            for (const line of text.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.stage === "done" && event.trip_id) {
                  const tripData = await fetch(`/api/v1/trips/${event.trip_id}`).then((r) => r.json());
                  const fullItinerary = tripData.trip?.itineraries?.[0]?.data as unknown as Itinerary | null;
                  if (fullItinerary) {
                    setItinerary(fullItinerary);
                  }
                  return;
                }
                if (event.stage === "error") {
                  setGenerationError("Generation failed. Please try again.");
                  bgGenRef.current = false;
                  return;
                }
              } catch { /* ignore malformed lines */ }
            }
          }
        } else {
          setGenerationError("Generation failed. Please try again.");
          bgGenRef.current = false;
        }
      } catch {
        setGenerationError("Something went wrong. Please try again.");
        bgGenRef.current = false;
      }
    };

    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialItinerary, retryCount]);

  // Background enrichment — fetch visa + weather after core itinerary renders
  const enrichItinerary = useCallback(async (
    currentRoute: typeof route,
    currentNationality: string,
    currentDateStart: string,
  ) => {
    const routePayload = currentRoute.map((r) => ({
      city: r.city,
      country: r.country,
      countryCode: r.countryCode,
      lat: r.lat,
      lng: r.lng,
    }));

    const fetchVisa = async (): Promise<VisaInfo[] | undefined> => {
      if (!currentNationality) return undefined;
      try {
        const res = await fetch("/api/v1/enrich/visa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nationality: currentNationality, route: routePayload }),
        });
        if (res.ok) {
          const { visaData } = await res.json();
          return visaData;
        }
      } catch { /* fail silently */ }
      return undefined;
    };

    const fetchWeather = async (): Promise<CityWeather[] | undefined> => {
      if (!currentDateStart) return undefined;
      try {
        const res = await fetch("/api/v1/enrich/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route: routePayload, dateStart: currentDateStart }),
        });
        if (res.ok) {
          const { weatherData } = await res.json();
          return weatherData;
        }
      } catch { /* fail silently */ }
      return undefined;
    };

    const [visaData, weatherData] = await Promise.all([fetchVisa(), fetchWeather()]);

    // Merge enrichment data into the existing itinerary in the store
    const current = useTripStore.getState().itinerary;
    if (current) {
      setItinerary({
        ...current,
        ...(visaData ? { visaData } : {}),
        ...(weatherData ? { weatherData } : {}),
      });
    }
  }, [setItinerary]);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: id, city_count: route.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Trigger background enrichment when itinerary is loaded but missing visa/weather data
  // Skip if still a partial itinerary (days not generated yet)
  useEffect(() => {
    if (!itinerary || itinerary.route.length === 0) return;
    if (itinerary.days.length === 0) return; // still generating — wait for full itinerary
    if (itinerary.visaData?.length && itinerary.weatherData?.length) return; // already enriched
    enrichItinerary(itinerary.route, nationality, dateStart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary?.route.length, itinerary?.days.length]);

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  const { budget } = itinerary;
  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity ? `${route[0].city}, ${route[0].country}` : countries.join(", ");
  const totalDays = days.length;
  const totalDaysFromRoute = route.reduce((sum, r) => sum + r.days, 0);
  const isGenerating = isPartialItinerary && !generationError;

  // Retry generation after an error
  const handleRetry = () => {
    bgGenRef.current = false;
    setGenerationError(null);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Fixed top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{tripTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {totalDays || totalDaysFromRoute} days{!singleCity && ` · ${countries.length} ${countries.length === 1 ? "country" : "countries"}`}
              {budget.total > 0 && ` · Est. €${budget.total.toLocaleString()}`}
            </span>
            {!isPartialItinerary && (
              <>
                <Link
                  href={`/trip/${id}/edit`}
                  className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Link>
                <Link
                  href={`/trip/${id}/summary`}
                  className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <LayoutList className="w-3.5 h-3.5" /> Summary
                </Link>
              </>
            )}
            {isGenerating && (
              <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Generation error banner */}
      {generationError && (
        <div className="fixed top-[7.5rem] left-0 right-0 z-30 bg-accent/10 border-b border-accent/30">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">{generationError}</p>
            <button onClick={handleRetry} className="shrink-0 btn-primary text-xs py-1.5 px-4">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Save-trip nudge for unauthenticated guests (hidden during generation) */}
      {isAuthenticated === false && !isPartialItinerary && !generationError && (
        <div className="fixed top-[7.5rem] left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-accent/40">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">
              Want to keep this itinerary? Create a free account to save it and access it from any device.
            </p>
            <Link
              href={`/signup?next=/trip/${id}`}
              className="shrink-0 btn-primary text-xs py-1.5 px-4"
            >
              Save trip
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`${
        (isAuthenticated === false && !isPartialItinerary && !generationError) || generationError
          ? "pt-[10.25rem]"
          : "pt-[7.5rem]"
      } min-h-[calc(100vh-7.5rem)]`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-border mb-6">
            {(["itinerary", "essentials", "budget", "map"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TAB_LABELS[tab]}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "itinerary" && (
            isPartialItinerary ? (
              <ItinerarySkeletonTab route={itinerary.route} isGenerating={isGenerating} />
            ) : (
              <ItineraryTab days={itinerary.days} route={itinerary.route} />
            )
          )}
          {activeTab === "essentials" && (
            <EssentialsTab itinerary={itinerary} />
          )}
          {activeTab === "budget" && (
            isPartialItinerary ? (
              <BudgetSkeletonTab isGenerating={isGenerating} />
            ) : (
              <BudgetTab budget={itinerary.budget} route={itinerary.route} days={itinerary.days} />
            )
          )}
          {activeTab === "map" && (
            <div className="h-150 rounded-xl overflow-hidden border border-border">
              <RouteMap
                cities={itinerary.route}
                activeCityIndex={activeCityIndex}
                onCityClick={(index: number) => setActiveCityIndex(index)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton components for partial itinerary state ──────────────────────────

function ItinerarySkeletonTab({ route, isGenerating }: { route: CityStop[]; isGenerating: boolean }) {
  // Group days by city based on route allocation
  let dayCounter = 1;
  const cityGroups = route.map((city) => {
    const startDay = dayCounter;
    dayCounter += city.days;
    return { city: city.city, startDay, endDay: dayCounter - 1, days: city.days };
  });

  return (
    <div className="space-y-3">
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl mb-4">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">Generating your daily itinerary...</span>
        </div>
      )}
      {cityGroups.map((group) =>
        Array.from({ length: group.days }, (_, i) => {
          const dayNum = group.startDay + i;
          return (
            <div
              key={dayNum}
              className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl animate-pulse"
            >
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                {dayNum}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {route.length === 1 ? `Day ${dayNum}` : `Day ${dayNum} – ${group.city}`}
                  </span>
                </div>
                <div className="w-32 h-3 bg-secondary rounded mt-1.5" />
              </div>
              <div className="w-16 h-5 bg-secondary rounded-full flex-shrink-0" />
            </div>
          );
        })
      )}
    </div>
  );
}

function BudgetSkeletonTab({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="space-y-8">
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">Calculating your budget...</span>
        </div>
      )}
      <div className="bg-background border border-border rounded-xl p-6 text-center animate-pulse">
        <div className="w-24 h-4 bg-secondary rounded mx-auto" />
        <div className="w-40 h-12 bg-secondary rounded mx-auto mt-3" />
        <div className="w-48 h-4 bg-secondary rounded mx-auto mt-3" />
      </div>
      <div className="animate-pulse">
        <div className="w-40 h-5 bg-secondary rounded mb-3" />
        <div className="h-4 bg-secondary rounded-full" />
        <div className="flex gap-4 mt-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full" />
              <div className="w-16 h-3 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
