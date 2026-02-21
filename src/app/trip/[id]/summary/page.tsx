"use client";

import { Fragment, use, useState } from "react";
import { motion } from "framer-motion";
import { Plane, Share2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Navbar } from "@/components/Navbar";
import { BackLink, Button, Skeleton } from "@/components/ui";
import { PDFDownloadButton } from "@/components/export/PDFDownloadButton";
import { useItinerary } from "@/hooks/useItinerary";
import { buildFlightLink, buildTrackedLink } from "@/lib/affiliate/link-generator";
import { getTripTitle, getUniqueCountries } from "@/lib/utils/trip-metadata";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { useTripStore } from "@/stores/useTripStore";
import { useShareTrip } from "@/hooks/api";

type Params = Promise<{ id: string }>;

function VisaDisclaimer() {
  return (
    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
      <strong>Important:</strong> Visa rules change frequently. This information is sourced from{" "}
      <a href="https://passportindex.org" target="_blank" rel="noopener noreferrer" className="underline">
        Passport Index
      </a>{" "}
      and may not reflect the latest requirements. Always verify with the official immigration authority
      before booking or travelling. Travel Pro accepts no responsibility for the accuracy of this information.
    </div>
  );
}

export default function SummaryPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
  const posthog = usePostHog();
  const itinerary = useItinerary();
  const travelers = useTripStore((s) => s.travelers);
  const shareMutation = useShareTrip();

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound />;
  }

  const { route, days, visaData, weatherData, flightLegs, flightBaselineCost } = itinerary;

  // Savings from date optimisation
  const flightTotal = flightLegs?.reduce((s, l) => s + l.price, 0) ?? 0;
  const savedAmount =
    flightBaselineCost && flightTotal > 0 && flightBaselineCost > flightTotal
      ? Math.round(flightBaselineCost - flightTotal)
      : null;

  // Derive trip metadata
  const countries = getUniqueCountries(route);
  const tripTitle = getTripTitle(route);
  const totalDays = days.length;
  const singleCity = route.length === 1;
  const firstDate = days[0]?.date ?? "";
  const lastDate = days[days.length - 1]?.date ?? "";

  const handleShareLink = async () => {
    try {
      let shareUrl = `${window.location.origin}/trip/${id}`;

      // Guest mode: no DB, just share the current trip URL
      if (id !== "guest") {
        const data = await shareMutation.mutateAsync(id);
        if (data.shareToken) {
          shareUrl = `${window.location.origin}/share/${data.shareToken}`;
          posthog?.capture("share_link_created", { trip_id: id });
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      posthog?.capture("share_link_copied", { trip_id: id, shareUrl });
    } catch {
      // Fall back gracefully
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">

        {/* Top action row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <BackLink href={`/trip/${id}`} label="Back to itinerary" />
          <div className="flex gap-3">
            <div onClick={() => posthog?.capture("pdf_export_clicked", { trip_id: id })}>
              <PDFDownloadButton
                days={days}
                route={route}
                visas={visaData ?? []}
                weather={weatherData ?? []}
                tripTitle={tripTitle}
                tripSubtitle={`${firstDate} – ${lastDate} · ${totalDays} days`}
                fileName={`TravelPro-${countries.join("-")}.pdf`}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareLink}
              loading={shareMutation.isPending}
              className="gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Copied!" : "Share Link"}
            </Button>
          </div>
        </div>

        {/* Title block */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">{tripTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {firstDate} &ndash; {lastDate} &middot; {totalDays} days
          </p>
        </motion.div>

        {/* Route overview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 card-travel bg-background"
        >
          <h2 className="font-semibold text-foreground mb-4">{singleCity ? "Destination" : "Route"}</h2>
          {singleCity ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-sm font-medium text-foreground">
                {route[0].city}, {route[0].country}
              </span>
              <span className="text-xs text-muted-foreground">({route[0].days} days)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {route.map((city, i) => (
                <div key={city.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{city.city}</span>
                    <span className="text-xs text-muted-foreground">({city.days}d)</span>
                  </div>
                  {i < route.length - 1 && (
                    <Plane className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Day-by-day compact table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <h2 className="font-semibold text-foreground mb-4">Day-by-Day Plan</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-3 font-medium text-foreground">Day</th>
                  {!singleCity && (
                    <th className="text-left px-4 py-3 font-medium text-foreground">City</th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-foreground hidden sm:table-cell">
                    Activities
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <Fragment key={day.day}>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 pb-1 sm:pb-3 text-muted-foreground font-mono text-xs">{day.day}</td>
                      {!singleCity && (
                        <td className="px-4 py-3 pb-1 sm:pb-3 font-medium text-foreground whitespace-nowrap">{day.city}</td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {day.isTravel && (
                          <span className="text-primary text-xs mr-2">
                            ✈ {day.travelFrom} &rarr; {day.travelTo}
                          </span>
                        )}
                        <span className="text-xs">
                          {day.activities.map((a) => a.name).join(", ")}
                        </span>
                      </td>
                    </tr>
                    {/* Mobile-only: activity summary */}
                    <tr className="sm:hidden">
                      <td colSpan={singleCity ? 1 : 2} className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
                        {day.isTravel && (
                          <span className="text-primary mr-1">
                            ✈ {day.travelFrom} → {day.travelTo} ·{" "}
                          </span>
                        )}
                        {day.activities.slice(0, 2).map((a) => a.name).join(", ")}
                        {day.activities.length > 2 && ` +${day.activities.length - 2} more`}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Visa checklist card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 card-travel bg-background"
        >
          <h2 className="font-semibold text-foreground mb-4">Visa Requirements</h2>
          {visaData && visaData.length > 0 ? (
            <div className="space-y-3">
              {visaData.map((visa) => (
                <div key={visa.countryCode} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{visa.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{visa.country}</span>
                      <span className="text-xs text-muted-foreground">{visa.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{visa.notes}</p>
                    <a
                      href={visa.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Verify: {visa.sourceLabel} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {route.map((r) => (
                <div key={r.id} className="flex items-start gap-3 animate-pulse">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-48 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <VisaDisclaimer />
        </motion.div>

        {/* Weather overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="font-semibold text-foreground mb-4">Weather Overview</h2>
          {weatherData && weatherData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {weatherData.map((w) => (
                <div key={w.city} className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl mb-1">{w.icon}</div>
                  <div className="text-xs font-semibold text-foreground">{w.city}</div>
                  <div className="text-sm font-bold text-primary mt-0.5">{w.temp}</div>
                  <div className="text-xs text-muted-foreground">{w.condition}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {route.map((r) => (
                <div key={r.id} className="text-center p-3 bg-secondary rounded-lg animate-pulse">
                  <Skeleton className="w-8 h-8 rounded-full mx-auto mb-1" />
                  <Skeleton className="w-16 h-3 mx-auto" />
                  <Skeleton className="w-10 h-4 mx-auto mt-1" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Flight Legs — real prices when optimization ran, generic link otherwise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Flights</h2>
            <div className="flex items-center gap-2">
              {savedAmount && (
                <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  Saved ~€{savedAmount.toLocaleString()}
                </span>
              )}
              {flightLegs ? (
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                  Optimized prices
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Estimated
                </span>
              )}
            </div>
          </div>
          {savedAmount && (
            <p className="text-xs text-muted-foreground mb-3">
              Date optimisation found a combination ~€{savedAmount.toLocaleString()} cheaper than the average across all valid date options.
            </p>
          )}

          {flightLegs ? (
            <div className="space-y-2">
              {flightLegs.map((leg, i) => {
                const skyscannerUrl = buildFlightLink(
                  { fromIata: leg.fromIata, toIata: leg.toIata, departureDate: leg.departureDate },
                  travelers ?? 1
                );
                const trackedUrl = buildTrackedLink({
                  provider: "skyscanner",
                  type: "flight",
                  itineraryId: id,
                  dest: skyscannerUrl,
                });
                return (
                  <a
                    key={i}
                    href={trackedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">✈️</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {leg.fromCity} → {leg.toCity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leg.departureDate} · {leg.duration} · {leg.airline}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        €{Math.round(leg.price).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        Skyscanner →
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <a
              href={buildTrackedLink({ provider: "skyscanner", type: "flight", itineraryId: id, dest: "https://www.skyscanner.com" })}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-all duration-200 group block"
            >
              <div className="text-2xl mb-2">✈️</div>
              <div className="font-medium text-sm text-foreground">Search Flights</div>
              <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Skyscanner &rarr;
              </div>
            </a>
          )}
        </motion.div>

        {/* Hotels + Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <h2 className="font-semibold text-foreground mb-4">Hotels &amp; Activities</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "Hotels", provider: "Booking.com", emoji: "🏨", provider_key: "booking" as const, type: "hotel" as const, dest: "https://www.booking.com" },
              { name: "Activities", provider: "GetYourGuide", emoji: "🎫", provider_key: "getyourguide" as const, type: "activity" as const, dest: "https://www.getyourguide.com" },
            ].map((item) => (
              <a
                key={item.name}
                href={buildTrackedLink({ provider: item.provider_key, type: item.type, itineraryId: id, dest: item.dest })}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-all duration-200 group block"
              >
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-medium text-sm text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  {item.provider} &rarr;
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Generated by Travel Pro &mdash; travelpro.app</p>
          <p>Generated on {today}</p>
        </div>
      </div>

      {/* Clipboard toast */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 whitespace-nowrap"
        >
          Link copied!
        </motion.div>
      )}
    </div>
  );
}
