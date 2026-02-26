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
import { ShareModal } from "@/components/trip/ShareModal";
import { useTripStore } from "@/stores/useTripStore";
import { useShareTrip } from "@/hooks/api";

type Params = Promise<{ id: string }>;

function VisaDisclaimer() {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
      <strong>Important:</strong> Visa rules change frequently. This information is sourced from{" "}
      <a
        href="https://passportindex.org"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Passport Index
      </a>{" "}
      and may not reflect the latest requirements. Always verify with the official immigration
      authority before booking or travelling. Travel Pro accepts no responsibility for the accuracy
      of this information.
    </div>
  );
}

export default function SummaryPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
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

  const handleShareClick = async () => {
    setShareModalOpen(true);

    // Guest mode: no DB, use the current trip URL directly
    if (id === "guest") {
      const url = `${window.location.origin}/trip/guest`;
      setShareUrl(url);
      return;
    }

    // Already resolved from a prior open — skip API call
    if (shareUrl) return;

    try {
      const data = await shareMutation.mutateAsync(id);
      if (data.shareToken) {
        const url = `${window.location.origin}/share/${data.shareToken}`;
        setShareUrl(url);
        posthog?.capture("share_link_created", { trip_id: id });
      }
    } catch {
      // Keep modal open with null URL — user can close and retry
    }
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        {/* Top action row */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
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
              onClick={handleShareClick}
              loading={shareMutation.isPending}
              className="gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Title block */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-foreground text-3xl font-bold">{tripTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {firstDate} &ndash; {lastDate} &middot; {totalDays} days
          </p>
        </motion.div>

        {/* Route overview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-travel bg-background mt-8"
        >
          <h2 className="text-foreground mb-4 font-semibold">
            {singleCity ? "Destination" : "Route"}
          </h2>
          {singleCity ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-foreground text-sm font-medium">
                {route[0].city}, {route[0].country}
              </span>
              <span className="text-muted-foreground text-xs">({route[0].days} days)</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {route.map((city, i) => (
                <div key={city.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-foreground text-sm font-medium">{city.city}</span>
                    <span className="text-muted-foreground text-xs">({city.days}d)</span>
                  </div>
                  {i < route.length - 1 && (
                    <Plane className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
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
          <h2 className="text-foreground mb-4 font-semibold">Day-by-Day Plan</h2>
          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-foreground px-4 py-3 text-left font-medium">Day</th>
                  {!singleCity && (
                    <th className="text-foreground px-4 py-3 text-left font-medium">City</th>
                  )}
                  <th className="text-foreground hidden px-4 py-3 text-left font-medium sm:table-cell">
                    Activities
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <Fragment key={day.day}>
                    <tr className="border-border border-t">
                      <td className="text-muted-foreground px-4 py-3 pb-1 font-mono text-xs sm:pb-3">
                        {day.day}
                      </td>
                      {!singleCity && (
                        <td className="text-foreground px-4 py-3 pb-1 font-medium whitespace-nowrap sm:pb-3">
                          {day.city}
                        </td>
                      )}
                      <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell">
                        {day.isTravel && (
                          <span className="text-primary mr-2 text-xs">
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
                      <td
                        colSpan={singleCity ? 1 : 2}
                        className="text-muted-foreground px-4 pt-0 pb-3 text-xs"
                      >
                        {day.isTravel && (
                          <span className="text-primary mr-1">
                            ✈ {day.travelFrom} → {day.travelTo} ·{" "}
                          </span>
                        )}
                        {day.activities
                          .slice(0, 2)
                          .map((a) => a.name)
                          .join(", ")}
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
          className="card-travel bg-background mt-8"
        >
          <h2 className="text-foreground mb-4 font-semibold">Visa Requirements</h2>
          {visaData && visaData.length > 0 ? (
            <div className="space-y-3">
              {visaData.map((visa) => (
                <div key={visa.countryCode} className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-xl">{visa.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-medium">{visa.country}</span>
                      <span className="text-muted-foreground text-xs">{visa.label}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {visa.notes}
                    </p>
                    <a
                      href={visa.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-1 inline-block text-xs hover:underline"
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
                <div key={r.id} className="flex animate-pulse items-start gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
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
          <h2 className="text-foreground mb-4 font-semibold">Weather Overview</h2>
          {weatherData && weatherData.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weatherData.map((w) => (
                <div key={w.city} className="bg-secondary rounded-lg p-3 text-center">
                  <div className="mb-1 text-2xl">{w.icon}</div>
                  <div className="text-foreground text-xs font-semibold">{w.city}</div>
                  <div className="text-primary mt-0.5 text-sm font-bold">{w.temp}</div>
                  <div className="text-muted-foreground text-xs">{w.condition}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {route.map((r) => (
                <div key={r.id} className="bg-secondary animate-pulse rounded-lg p-3 text-center">
                  <Skeleton className="mx-auto mb-1 h-8 w-8 rounded-full" />
                  <Skeleton className="mx-auto h-3 w-16" />
                  <Skeleton className="mx-auto mt-1 h-4 w-10" />
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground font-semibold">Flights</h2>
            <div className="flex items-center gap-2">
              {savedAmount && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Saved ~€{savedAmount.toLocaleString()}
                </span>
              )}
              {flightLegs ? (
                <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-xs font-medium">
                  Optimized prices
                </span>
              ) : (
                <span className="text-muted-foreground bg-secondary rounded-full px-2 py-0.5 text-xs">
                  Estimated
                </span>
              )}
            </div>
          </div>
          {savedAmount && (
            <p className="text-muted-foreground mb-3 text-xs">
              Date optimisation found a combination ~€{savedAmount.toLocaleString()} cheaper than
              the average across all valid date options.
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
                    className="border-border hover:border-primary hover:bg-primary/5 group flex items-center justify-between rounded-xl border p-3 transition-all duration-200"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-lg">✈️</span>
                      <div className="min-w-0">
                        <div className="text-foreground truncate text-sm font-medium">
                          {leg.fromCity} → {leg.toCity}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {leg.departureDate} · {leg.duration} · {leg.airline}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground text-sm font-bold">
                        €{Math.round(leg.price).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                        Skyscanner →
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <a
              href={buildTrackedLink({
                provider: "skyscanner",
                type: "flight",
                itineraryId: id,
                dest: "https://www.skyscanner.com",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:border-primary hover:bg-primary/5 group block rounded-xl border p-4 transition-all duration-200"
            >
              <div className="mb-2 text-2xl">✈️</div>
              <div className="text-foreground text-sm font-medium">Search Flights</div>
              <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
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
          <h2 className="text-foreground mb-4 font-semibold">Hotels &amp; Activities</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                name: "Hotels",
                provider: "Booking.com",
                emoji: "🏨",
                provider_key: "booking" as const,
                type: "hotel" as const,
                dest: "https://www.booking.com",
              },
              {
                name: "Activities",
                provider: "GetYourGuide",
                emoji: "🎫",
                provider_key: "getyourguide" as const,
                type: "activity" as const,
                dest: "https://www.getyourguide.com",
              },
            ].map((item) => (
              <a
                key={item.name}
                href={buildTrackedLink({
                  provider: item.provider_key,
                  type: item.type,
                  itineraryId: id,
                  dest: item.dest,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:border-primary hover:bg-primary/5 group block rounded-xl border p-4 transition-all duration-200"
              >
                <div className="mb-2 text-2xl">{item.emoji}</div>
                <div className="text-foreground text-sm font-medium">{item.name}</div>
                <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                  {item.provider} &rarr;
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-muted-foreground mt-12 text-center text-sm">
          <p>Generated by Travel Pro &mdash; travelpro.app</p>
          <p>Generated on {today}</p>
        </div>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        isLoading={shareMutation.isPending}
        tripTitle={tripTitle}
      />
    </div>
  );
}
