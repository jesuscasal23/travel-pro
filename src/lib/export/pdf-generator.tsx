// ============================================================
// Travel Pro — PDF Document
// Built with @react-pdf/renderer (own renderer — no Tailwind/DOM)
//
// Sections:
//   1. Branded header (fixed, every page)
//   2. Mapbox Static Images map
//   3. Trip title + route overview
//   4. Day-by-day compact table
//   5. Visa requirements table
//   6. Weather overview table
//   7. Booking links
//   8. Footer with page N of M (fixed, every page)
// ============================================================

import React from "react";
import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";

import { sampleItinerary, sampleRoute, sampleVisas, sampleWeather } from "@/data/sampleData";
import type { TripDay, CityStop, VisaInfo, CityWeather } from "@/types";

// ============================================================
// Tokens
// ============================================================

const TEAL = "#0D7377";
const TEAL_LIGHT = "#E8F5F5";
const CORAL = "#E85D4A";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";
const HEADING = "#111827";
const WHITE = "#FFFFFF";
const ROW_ALT = "#F9FAFB";
const TRAVEL_ROW = "#EFF6FF";

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 52, // room for fixed header
    paddingBottom: 44, // room for fixed footer
    paddingHorizontal: 40,
    backgroundColor: WHITE,
    color: HEADING,
    lineHeight: 1.4,
  },

  // ── Fixed header (repeats on every page) ─────────────────────
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: TEAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  headerBrand: {
    color: WHITE,
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerTagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 8,
  },

  // ── Fixed footer (repeats on every page) ─────────────────────
  footer: {
    position: "absolute",
    bottom: 12,
    left: 40,
    right: 40,
    textAlign: "center",
    color: MUTED,
    fontSize: 7.5,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },

  // ── Section wrappers ──────────────────────────────────────────
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: TEAL_LIGHT,
  },

  // ── Map image ────────────────────────────────────────────────
  mapImage: {
    width: "100%",
    height: 180,
    marginBottom: 16,
    objectFit: "cover",
  },

  // ── Trip title block ─────────────────────────────────────────
  tripTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
    marginBottom: 3,
  },
  tripSubtitle: {
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 16,
  },

  // ── Route row ────────────────────────────────────────────────
  routeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 4,
  },
  routeCity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TEAL,
    color: WHITE,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 2,
  },
  routeCityName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
  },
  routeDays: {
    fontSize: 7.5,
    color: MUTED,
  },
  routeArrow: {
    fontSize: 9,
    color: MUTED,
    marginHorizontal: 2,
  },

  // ── Generic table ─────────────────────────────────────────────
  table: {
    marginBottom: 4,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: TEAL,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeadCell: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: ROW_ALT,
  },
  tableRowTravel: {
    backgroundColor: TRAVEL_ROW,
  },
  tableCell: {
    fontSize: 8,
    color: HEADING,
  },
  tableCellMuted: {
    fontSize: 7.5,
    color: MUTED,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
  },

  // ── Expanded day section styles ───────────────────────────────
  daySectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  dayActivityRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 2,
  },
  dayActivityName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
    flex: 1,
  },
  dayActivityMeta: {
    fontSize: 7.5,
    color: MUTED,
    textAlign: "right" as const,
    marginLeft: 8,
  },
  dayActivityWhy: {
    fontSize: 7.5,
    color: MUTED,
    marginBottom: 1,
  },
  dayActivityTip: {
    fontSize: 7,
    color: MUTED,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 1,
  },
  dayActivityFood: {
    fontSize: 7,
    color: "#92400E",
    marginBottom: 4,
  },
  dayTravelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: TRAVEL_ROW,
    borderRadius: 3,
    marginBottom: 4,
  },
  dayTravelText: {
    fontSize: 8,
    color: MUTED,
  },

  // ── Day table column widths (legacy) ─────────────────────────
  colDay: { width: "9%" },
  colCity: { width: "16%" },
  colActivities: { width: "75%" },

  // ── Visa table column widths ─────────────────────────────────
  colVCountry: { width: "22%" },
  colVReq: { width: "22%" },
  colVStay: { width: "16%" },
  colVNotes: { width: "40%" },

  // ── Weather table column widths ───────────────────────────────
  colWCity: { width: "30%" },
  colWTemp: { width: "20%" },
  colWCond: { width: "50%" },

  // ── Booking links ─────────────────────────────────────────────
  bookingGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  bookingCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  bookingEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  bookingTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: HEADING,
    marginBottom: 3,
    textAlign: "center",
  },
  bookingDesc: {
    fontSize: 7.5,
    color: MUTED,
    textAlign: "center",
    marginBottom: 6,
  },
  bookingLink: {
    fontSize: 8,
    color: TEAL,
    textDecoration: "underline",
  },
});

// ============================================================
// Helpers
// ============================================================

function formatLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function buildMapboxUrl(route: CityStop[]): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  // Mapbox pin format: pin-s-LABEL+COLOR(LNG,LAT)
  const pins = route.map((stop, i) => `pin-s-${i + 1}+0D7377(${stop.lng},${stop.lat})`).join(",");

  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${pins}/auto/800x300@2x?padding=60&access_token=${token}`
  );
}

// ============================================================
// Sub-components
// ============================================================

function RouteOverview({ route }: { route: CityStop[] }) {
  return (
    <View style={styles.routeRow}>
      {route.map((stop, i) => (
        <React.Fragment key={stop.id}>
          <View style={styles.routeCity}>
            <Text style={styles.routeBadge}>{i + 1}</Text>
            <View>
              <Text style={styles.routeCityName}>{stop.city}</Text>
              <Text style={styles.routeDays}>
                {stop.days}d · {stop.country}
              </Text>
            </View>
          </View>
          {i < route.length - 1 && <Text style={styles.routeArrow}>›</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Groups consecutive days by city, then renders each group as a section */
function DaySections({ days }: { days: TripDay[] }) {
  // Group into city blocks (consecutive days with the same city)
  const groups: { city: string; days: TripDay[] }[] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && last.city === day.city) {
      last.days.push(day);
    } else {
      groups.push({ city: day.city, days: [day] });
    }
  }

  return (
    <>
      {groups.map((group, gi) => (
        <View key={gi} style={{ marginBottom: 12 }}>
          {/* City heading */}
          <Text style={styles.daySectionTitle}>{group.city}</Text>

          {group.days.map((day) => (
            <View key={day.day} style={{ marginBottom: 8 }}>
              {/* Day label */}
              <Text style={[styles.tableCellBold, { marginBottom: 3 }]}>
                Day {day.day}
                {day.date ? `  ·  ${day.date}` : ""}
              </Text>

              {/* Travel day */}
              {day.isTravel && day.travelFrom && day.travelTo ? (
                <View style={styles.dayTravelRow}>
                  <Text style={styles.dayTravelText}>
                    ✈ {day.travelFrom} → {day.travelTo}
                    {day.travelDuration ? `  ·  ${day.travelDuration}` : ""}
                  </Text>
                </View>
              ) : day.activities.length === 0 ? (
                <Text style={styles.tableCellMuted}>Rest / Free Day</Text>
              ) : (
                day.activities.map((act, ai) => (
                  <View key={ai} style={{ marginBottom: 5 }}>
                    <View style={styles.dayActivityRow}>
                      <Text style={styles.dayActivityName}>{act.name}</Text>
                      <Text style={styles.dayActivityMeta}>
                        {[act.duration, act.cost].filter(Boolean).join("  ·  ")}
                      </Text>
                    </View>
                    {act.why ? <Text style={styles.dayActivityWhy}>{act.why}</Text> : null}
                    {act.tip ? <Text style={styles.dayActivityTip}>💡 {act.tip}</Text> : null}
                    {act.food ? <Text style={styles.dayActivityFood}>🍽️ {act.food}</Text> : null}
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function VisaTable({ visas }: { visas: VisaInfo[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.tableHeadCell, styles.colVCountry]}>Country</Text>
        <Text style={[styles.tableHeadCell, styles.colVReq]}>Requirement</Text>
        <Text style={[styles.tableHeadCell, styles.colVStay]}>Max Stay</Text>
        <Text style={[styles.tableHeadCell, styles.colVNotes]}>Notes</Text>
      </View>
      {visas.map((visa, i) => (
        <View
          key={visa.countryCode}
          style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
        >
          <Text style={[styles.tableCellBold, styles.colVCountry]}>
            {visa.icon} {visa.country}
          </Text>
          <Text style={[styles.tableCell, styles.colVReq]}>{formatLabel(visa.requirement)}</Text>
          <Text style={[styles.tableCell, styles.colVStay]}>{visa.maxStayDays} days</Text>
          <Text style={[styles.tableCellMuted, styles.colVNotes]}>{visa.notes}</Text>
        </View>
      ))}
    </View>
  );
}

function WeatherTable({ weather }: { weather: CityWeather[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.tableHeadCell, styles.colWCity]}>City</Text>
        <Text style={[styles.tableHeadCell, styles.colWTemp]}>Avg Temp</Text>
        <Text style={[styles.tableHeadCell, styles.colWCond]}>Conditions</Text>
      </View>
      {weather.map((w, i) => (
        <View key={w.city} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.tableCellBold, styles.colWCity]}>{w.city}</Text>
          <Text style={[styles.tableCell, styles.colWTemp]}>{w.temp}</Text>
          <Text style={[styles.tableCell, styles.colWCond]}>
            {w.icon} {w.condition}
          </Text>
        </View>
      ))}
    </View>
  );
}

function BookingLinks() {
  const bookings = [
    {
      emoji: "✈️",
      title: "Flights",
      desc: "Compare and book flights from all major carriers",
      label: "Skyscanner",
      href: "https://www.skyscanner.com",
    },
    {
      emoji: "🏨",
      title: "Hotels",
      desc: "Book accommodation — free cancellation available",
      label: "Booking.com",
      href: "https://www.booking.com",
    },
    {
      emoji: "🎟️",
      title: "Activities",
      desc: "Book tours, tickets, and experiences in advance",
      label: "GetYourGuide",
      href: "https://www.getyourguide.com",
    },
  ];

  return (
    <View style={styles.bookingGrid}>
      {bookings.map((b) => (
        <View key={b.title} style={styles.bookingCard}>
          <Text style={styles.bookingEmoji}>{b.emoji}</Text>
          <Text style={styles.bookingTitle}>{b.title}</Text>
          <Text style={styles.bookingDesc}>{b.desc}</Text>
          <Link src={b.href} style={styles.bookingLink}>
            {b.label} →
          </Link>
        </View>
      ))}
    </View>
  );
}

// ============================================================
// Main Document
// ============================================================

export interface TripPDFDocumentProps {
  /** Optionally override sample data with real AI-generated itinerary */
  days?: TripDay[];
  route?: CityStop[];
  visas?: VisaInfo[];
  weather?: CityWeather[];
  tripTitle?: string;
  tripSubtitle?: string;
}

export function TripPDFDocument({
  days = sampleItinerary,
  route = sampleRoute,
  visas = sampleVisas,
  weather = sampleWeather,
  tripTitle = "Japan, Vietnam & Thailand",
  tripSubtitle = "Oct 1 – Oct 22, 2026 · 22 days · 2 travelers",
}: TripPDFDocumentProps) {
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const mapUrl = buildMapboxUrl(route);

  return (
    <Document
      title={`TravelPro — ${tripTitle}`}
      author="Travel Pro"
      subject="Trip Itinerary"
      creator="travelpro.app"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Fixed header ───────────────────────────────────── */}
        <View style={styles.header} fixed>
          <Text style={styles.headerBrand}>Travel Pro</Text>
          <Text style={styles.headerTagline}>Generated {generatedDate}</Text>
        </View>

        {/* ── Fixed footer ───────────────────────────────────── */}
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated by Travel Pro — travelpro.app · Page ${pageNumber} of ${totalPages}`
          }
        />

        {/* ── Map ────────────────────────────────────────────── */}
        {mapUrl && <Image src={mapUrl} style={styles.mapImage} />}

        {/* ── Trip title ─────────────────────────────────────── */}
        <Text style={styles.tripTitle}>{tripTitle}</Text>
        <Text style={styles.tripSubtitle}>{tripSubtitle}</Text>

        {/* ── Route overview ─────────────────────────────────── */}
        <RouteOverview route={route} />

        {/* ── Day-by-day sections ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Day-by-Day Itinerary</Text>
          <DaySections days={days} />
        </View>

        {/* ── Visa requirements ──────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visa Requirements</Text>
          <VisaTable visas={visas} />
        </View>

        {/* ── Weather overview ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Weather</Text>
          <WeatherTable weather={weather} />
        </View>

        {/* ── Booking links ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Your Trip</Text>
          <BookingLinks />
        </View>
      </Page>
    </Document>
  );
}
