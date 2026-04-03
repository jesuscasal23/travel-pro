"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hotel as HotelIcon, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MobileJourneyTab } from "@/components/trip/mobile/MobileJourneyTab";
import { MobileDiscoveryTab } from "@/components/trip/mobile/MobileDiscoveryTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";
import { buildTripPresentation } from "@/lib/utils/trip/presentation";

interface CelebrationCardProps {
  badge: string;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}

function CelebrationCard({ badge, title, description, icon, children }: CelebrationCardProps) {
  return (
    <div className="shadow-glass-xl relative overflow-hidden rounded-[32px] border border-white/85 bg-white/92 px-5 py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,186,142,0.32),_transparent_65%)]" />
      <div className="relative flex flex-col gap-3">
        <div className="text-brand-primary flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase">
          {icon ?? <PartyPopper className="text-brand-primary h-4 w-4" />}
          <span>{badge}</span>
        </div>
        <h2 className="text-navy text-[1.65rem] leading-[1.05] font-bold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="text-dim text-sm">{description}</p>
        {children ? <div className="mt-1 flex flex-col gap-2">{children}</div> : null}
      </div>
    </div>
  );
}

export default function TripItineraryPage() {
  const {
    itinerary,
    tripId,
    tripTitle,
    discoveryStatus,
    discoveryCards,
    discoveryCursor,
    discoveryTotalTarget,
    discoveryIsLoading,
    discoveryError,
    discoveryNotice,
    onDiscoverySwipe,
    discoveryCityIndex,
    discoveryTotalCities,
    discoveryLikedCount,
    discoveryRequiredCount,
    discoveryRoundLimitReached,
    assignedActivities,
  } = useTripContext();

  const router = useRouter();
  const searchParams = useSearchParams();
  const firstRunQuery = searchParams?.get("firstRun") === "1";
  const [firstRunMode, setFirstRunMode] = useState(() => firstRunQuery);
  const [discoveryBannerDismissed, setDiscoveryBannerDismissed] = useState(false);
  const [itineraryBannerDismissed, setItineraryBannerDismissed] = useState(false);

  useEffect(() => {
    if (firstRunQuery) {
      router.replace(`/trips/${tripId}/itinerary`, { scroll: false });
    }
  }, [firstRunQuery, router, tripId]);

  const disableCelebration = useCallback(() => {
    setFirstRunMode(false);
    setDiscoveryBannerDismissed(true);
    setItineraryBannerDismissed(true);
  }, []);

  const handleStartDiscovery = useCallback(() => {
    setDiscoveryBannerDismissed(true);
  }, []);

  const handleViewHotels = useCallback(() => {
    setItineraryBannerDismissed(true);
    setFirstRunMode(false);
    router.push(`/trips/${tripId}/hotels?fromItinerary=1`);
  }, [router, tripId]);

  const handleKeepPlanning = useCallback(() => {
    setItineraryBannerDismissed(true);
    setFirstRunMode(false);
  }, []);

  const plannedDayCount = useMemo(() => {
    if (!itinerary) return 0;
    return itinerary.days.filter((day) => !day.isTravel).length;
  }, [itinerary]);

  if (!itinerary) {
    return (
      <TripMobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-foreground text-lg font-bold">No itinerary yet</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Generate your itinerary to see your day-by-day plan here.
          </p>
        </div>
      </TripMobileShell>
    );
  }

  const showItinerary =
    discoveryStatus === "completed" && (assignedActivities.length > 0 || itinerary.days.length > 0);
  const currentCityName = itinerary.route[discoveryCityIndex]?.city;
  const { destinationLabel: celebrationDestination } = buildTripPresentation({
    route: itinerary.route,
    fallbackLabel: tripTitle,
    fallbackTitle: tripTitle,
  });

  const showDiscoveryCelebration =
    firstRunMode && !showItinerary && discoveryStatus !== "completed" && !discoveryBannerDismissed;
  const showItineraryCelebration = firstRunMode && showItinerary && !itineraryBannerDismissed;

  return (
    <TripMobileShell showBanners showHero={firstRunMode}>
      {showDiscoveryCelebration ? (
        <CelebrationCard
          badge="Your trip is live"
          title={`Amazing — you're going to ${celebrationDestination}!`}
          description="We’re celebrating with a fresh deck of experiences picked for your vibe. Swipe to keep what you love and we’ll stitch the perfect flow."
          icon={<Sparkles className="text-brand-primary h-4 w-4" />}
        >
          <Button variant="brand" onClick={handleStartDiscovery}>
            Start swiping activities
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDiscoveryBannerDismissed(true)}>
            Maybe later
          </Button>
        </CelebrationCard>
      ) : null}

      {showItineraryCelebration ? (
        <CelebrationCard
          badge="Itinerary created"
          title={`We built the first ${plannedDayCount} days for you`}
          description="Based on your picks, here’s a draft itinerary. Want us to carry that momentum into your stay?"
        >
          <Button variant="brand" onClick={handleViewHotels}>
            <HotelIcon className="mr-2 h-4 w-4" />
            Browse recommended stays
          </Button>
          <Button variant="ghost" size="sm" onClick={handleKeepPlanning}>
            Keep planning here
          </Button>
        </CelebrationCard>
      ) : null}

      {showItinerary ? (
        <MobileJourneyTab itinerary={itinerary} assignedActivities={assignedActivities} />
      ) : (
        <MobileDiscoveryTab
          status={discoveryStatus}
          cards={discoveryCards}
          cursor={discoveryCursor}
          totalTarget={discoveryTotalTarget}
          isLoading={discoveryIsLoading}
          error={discoveryError}
          notice={discoveryNotice}
          isMultiCity={itinerary.route.length > 1}
          onSwipe={onDiscoverySwipe}
          cityIndex={discoveryCityIndex}
          totalCities={discoveryTotalCities}
          likedCount={discoveryLikedCount}
          requiredCount={discoveryRequiredCount}
          currentCityName={currentCityName}
          roundLimitReached={discoveryRoundLimitReached}
        />
      )}

      {firstRunMode && (
        <div className="text-label mt-6 text-center text-[11px] font-semibold tracking-[0.2em] uppercase">
          <button type="button" onClick={disableCelebration}>
            Dismiss celebration mode
          </button>
        </div>
      )}
    </TripMobileShell>
  );
}
