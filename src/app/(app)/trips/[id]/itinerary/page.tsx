"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hotel as HotelIcon, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MobileJourneyTab } from "@/components/trip/mobile/MobileJourneyTab";
import { MobileDiscoveryTab } from "@/components/trip/mobile/MobileDiscoveryTab";
import { TripMobileShell } from "@/components/trip/mobile/TripMobileShell";
import { useTripContext } from "@/components/trip/TripContext";

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
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary">
          {icon ?? <PartyPopper className="h-4 w-4 text-brand-primary" />}
          <span>{badge}</span>
        </div>
        <h2 className="text-navy text-[1.65rem] font-bold leading-[1.05] tracking-[-0.03em]">
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
  const [firstRunMode, setFirstRunMode] = useState(firstRunQuery);
  const [discoveryBannerDismissed, setDiscoveryBannerDismissed] = useState(false);
  const [journeyBannerDismissed, setJourneyBannerDismissed] = useState(false);

  useEffect(() => {
    if (firstRunQuery) {
      setFirstRunMode(true);
      router.replace(`/trips/${tripId}/itinerary`, { scroll: false });
    }
  }, [firstRunQuery, router, tripId]);

  const disableCelebration = useCallback(() => {
    setFirstRunMode(false);
    setDiscoveryBannerDismissed(true);
    setJourneyBannerDismissed(true);
  }, []);

  const handleStartDiscovery = useCallback(() => {
    setDiscoveryBannerDismissed(true);
  }, []);

  const handleViewHotels = useCallback(() => {
    setJourneyBannerDismissed(true);
    setFirstRunMode(false);
    router.push(`/trips/${tripId}/hotels?fromItinerary=1`);
  }, [router, tripId]);

  const handleKeepPlanning = useCallback(() => {
    setJourneyBannerDismissed(true);
    setFirstRunMode(false);
  }, []);

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

  const showJourney =
    discoveryStatus === "completed" && (assignedActivities.length > 0 || itinerary.days.length > 0);
  const currentCityName = itinerary.route[discoveryCityIndex]?.city;
  const destinationName = itinerary.route[0]?.city ?? tripTitle;
  const plannedDayCount = useMemo(
    () => itinerary.days.filter((day) => !day.isTravel).length,
    [itinerary.days]
  );

  const showDiscoveryCelebration =
    firstRunMode && !showJourney && discoveryStatus !== "completed" && !discoveryBannerDismissed;
  const showJourneyCelebration = firstRunMode && showJourney && !journeyBannerDismissed;

  return (
    <TripMobileShell showBanners showHero={firstRunMode}>
      {showDiscoveryCelebration ? (
        <CelebrationCard
          badge="Your trip is live"
          title={`Amazing — you're going to ${destinationName}!`}
          description="We’re celebrating with a fresh deck of experiences picked for your vibe. Swipe to keep what you love and we’ll stitch the perfect flow."
          icon={<Sparkles className="h-4 w-4 text-brand-primary" />}
        >
          <Button variant="brand" onClick={handleStartDiscovery}>
            Start swiping activities
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDiscoveryBannerDismissed(true)}>
            Maybe later
          </Button>
        </CelebrationCard>
      ) : null}

      {showJourneyCelebration ? (
        <CelebrationCard
          badge="Itinerary created"
          title={`We built the first ${plannedDayCount} days for you`}
          description="Based on your picks, here’s a draft journey. Want us to carry that momentum into your stay?"
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

      {showJourney ? (
        <MobileJourneyTab itinerary={itinerary} assignedActivities={assignedActivities} />
      ) : (
        <MobileDiscoveryTab
          status={discoveryStatus}
          cards={discoveryCards}
          cursor={discoveryCursor}
          totalTarget={discoveryTotalTarget}
          isLoading={discoveryIsLoading}
          error={discoveryError}
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
        <div className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-label">
          <button type="button" onClick={disableCelebration}>
            Dismiss celebration mode
          </button>
        </div>
      )}
    </TripMobileShell>
  );
}
