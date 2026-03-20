// ============================================================
// Travel Pro — Database Seed
// Seeds the Thomas & Lena demo trip for the demo account
// Run: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000001";
const DEMO_PROFILE_ID = "demo-profile-0000-0000-0000-000000000001";
const DEMO_TRIP_ID = "demo-trip-000000-0000-0000-0000-000000000001";
const DEMO_ITINERARY_ID = "demo-itinerary-000-0000-0000-000000000001";

const demoItineraryData = {
  route: [
    {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.6762,
      lng: 139.6503,
      days: 4,
      countryCode: "JP",
    },
    {
      id: "kyoto",
      city: "Kyoto",
      country: "Japan",
      lat: 35.0116,
      lng: 135.7681,
      days: 3,
      countryCode: "JP",
    },
    {
      id: "hanoi",
      city: "Hanoi",
      country: "Vietnam",
      lat: 21.0285,
      lng: 105.8542,
      days: 3,
      countryCode: "VN",
    },
    {
      id: "halong",
      city: "Ha Long Bay",
      country: "Vietnam",
      lat: 20.9101,
      lng: 107.1839,
      days: 2,
      countryCode: "VN",
    },
    {
      id: "bangkok",
      city: "Bangkok",
      country: "Thailand",
      lat: 13.7563,
      lng: 100.5018,
      days: 3,
      countryCode: "TH",
    },
    {
      id: "chiangmai",
      city: "Chiang Mai",
      country: "Thailand",
      lat: 18.7883,
      lng: 98.9853,
      days: 3,
      countryCode: "TH",
    },
    {
      id: "phuket",
      city: "Phuket",
      country: "Thailand",
      lat: 7.8804,
      lng: 98.3923,
      days: 4,
      countryCode: "TH",
    },
  ],
  budget: {
    flights: 2800,
    accommodation: 3200,
    activities: 1500,
    food: 1200,
    transport: 800,
    total: 9500,
    budget: 10000,
  },
  visaData: [
    {
      country: "Japan",
      countryCode: "JP",
      requirement: "visa-free",
      maxStayDays: 90,
      notes: "Visa-free for German passport holders up to 90 days",
      icon: "✅",
      label: "Visa Free",
    },
    {
      country: "Vietnam",
      countryCode: "VN",
      requirement: "e-visa",
      maxStayDays: 90,
      processingDays: 3,
      notes: "E-visa required. Apply at evisa.xuatnhapcanh.gov.vn. €25 fee.",
      icon: "🌐",
      label: "E-Visa",
    },
    {
      country: "Thailand",
      countryCode: "TH",
      requirement: "visa-free",
      maxStayDays: 60,
      notes: "Visa-exempt entry for German passport holders up to 60 days",
      icon: "✅",
      label: "Visa Free",
    },
  ],
  weatherData: [
    { city: "Tokyo", temp: "18°C", condition: "Mild & Clear", icon: "🌤️" },
    { city: "Kyoto", temp: "16°C", condition: "Cool & Pleasant", icon: "🍂" },
    { city: "Hanoi", temp: "22°C", condition: "Warm & Humid", icon: "🌥️" },
    { city: "Ha Long Bay", temp: "24°C", condition: "Warm & Partly Cloudy", icon: "⛅" },
    { city: "Bangkok", temp: "33°C", condition: "Hot & Sunny", icon: "☀️" },
    { city: "Chiang Mai", temp: "28°C", condition: "Warm & Pleasant", icon: "🌤️" },
    { city: "Phuket", temp: "31°C", condition: "Tropical & Sunny", icon: "🏖️" },
  ],
  days: [],
};

async function main() {
  console.log("🌱 Seeding demo data...");

  // Upsert demo profile
  await prisma.profile.upsert({
    where: { id: DEMO_PROFILE_ID },
    update: {},
    create: {
      id: DEMO_PROFILE_ID,
      userId: DEMO_USER_ID,
      nationality: "German",
      homeAirport: "LEJ – Leipzig/Halle",
      travelStyle: "smart-budget",
      interests: ["Cultural Experiences", "Food & Cuisine", "History", "Architecture"],
      activityLevel: "moderate",
      languagesSpoken: ["German", "English"],
      onboardingCompleted: true,
    },
  });

  // Upsert demo trip
  await prisma.trip.upsert({
    where: { id: DEMO_TRIP_ID },
    update: {},
    create: {
      id: DEMO_TRIP_ID,
      profileId: DEMO_PROFILE_ID,
      region: "Asia",
      dateStart: "2025-03-15",
      dateEnd: "2025-04-05",
      flexibleDates: false,
      budget: 10000,
      travelers: 2,
    },
  });

  // Upsert demo itinerary
  await prisma.itinerary.upsert({
    where: { id: DEMO_ITINERARY_ID },
    update: {},
    create: {
      id: DEMO_ITINERARY_ID,
      tripId: DEMO_TRIP_ID,
      data: demoItineraryData,
      version: 1,
      isActive: true,
      promptVersion: "v1",
      generationStatus: "complete",
    },
  });

  console.log("✅ Demo data seeded successfully");
  console.log(`   Profile: ${DEMO_PROFILE_ID}`);
  console.log(`   Trip: ${DEMO_TRIP_ID}`);
  console.log(`   Itinerary: ${DEMO_ITINERARY_ID}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
