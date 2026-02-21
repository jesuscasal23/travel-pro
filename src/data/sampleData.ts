import type {
  CityStop,
  TripDay,
  VisaInfo,
  CityWeather,
  SavedTrip,
  Region,
  InterestOption,
  Itinerary,
} from "@/types";

// ============================================================
// Route — 7 cities across Japan, Vietnam, Thailand
// ============================================================

export const sampleRoute: CityStop[] = [
  { id: "tokyo", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, days: 5, countryCode: "JP", iataCode: "NRT" },
  { id: "kyoto", city: "Kyoto", country: "Japan", lat: 35.01, lng: 135.77, days: 3, countryCode: "JP", iataCode: "ITM" },
  { id: "hanoi", city: "Hanoi", country: "Vietnam", lat: 21.03, lng: 105.85, days: 3, countryCode: "VN", iataCode: "HAN" },
  { id: "halong", city: "Ha Long Bay", country: "Vietnam", lat: 20.95, lng: 107.07, days: 2, countryCode: "VN", iataCode: "HPH" },
  { id: "bangkok", city: "Bangkok", country: "Thailand", lat: 13.76, lng: 100.5, days: 4, countryCode: "TH", iataCode: "BKK" },
  { id: "chiangmai", city: "Chiang Mai", country: "Thailand", lat: 18.79, lng: 98.98, days: 3, countryCode: "TH", iataCode: "CNX" },
  { id: "phuket", city: "Phuket", country: "Thailand", lat: 7.88, lng: 98.39, days: 2, countryCode: "TH", iataCode: "HKT" },
];

// ============================================================
// Itinerary — 22 days, full activity depth
// Each activity: name, category, icon, why, duration, tip?, food?, cost?
// ============================================================

export const sampleItinerary: TripDay[] = [
  // === TOKYO (Days 1–5) ===
  {
    day: 1, date: "Oct 1", city: "Tokyo",
    activities: [
      { name: "Senso-ji Temple", category: "culture", icon: "⛩️", why: "Tokyo's oldest temple — stunning Kaminarimon gate and Nakamise shopping street", duration: "2h", tip: "Visit before 9am to avoid crowds", food: "Try melon pan from a street stall nearby", cost: "Free" },
      { name: "Asakusa District Walk", category: "explore", icon: "🚶", why: "Traditional district with old-world charm, perfect for first-day orientation", duration: "1.5h", tip: "Rent a kimono for photos — shops line the main street" },
      { name: "Akihabara Electric Town", category: "culture", icon: "🎮", why: "Iconic neon-lit district for electronics, anime, and gaming culture", duration: "2h", cost: "Free (browsing)" },
      { name: "Ramen Dinner in Shinjuku", category: "food", icon: "🍜", why: "Shinjuku has some of Tokyo's best ramen alleys", duration: "1h", food: "Fuunji for tsukemen (dipping ramen) — expect a 20min queue", cost: "€12" },
    ],
  },
  {
    day: 2, date: "Oct 2", city: "Tokyo",
    activities: [
      { name: "Tsukiji Outer Market", category: "food", icon: "🐟", why: "Fresh sushi breakfast at the world's most famous fish market", duration: "2h", food: "Sushi Dai or Daiwa Sushi for the best omakase", cost: "€20–30", tip: "Arrive by 7am — stalls close by noon" },
      { name: "teamLab Borderless", category: "art", icon: "🎨", why: "Immersive digital art museum — one of Tokyo's most magical experiences", duration: "3h", cost: "€25", tip: "Book tickets online at least 3 days ahead" },
      { name: "Shibuya Crossing & Hachiko", category: "explore", icon: "🚶", why: "The world's busiest pedestrian crossing — best viewed from Starbucks above", duration: "1h", cost: "Free" },
      { name: "Izakaya Hopping in Shibuya", category: "food", icon: "🍻", why: "Japanese-style pub crawl through narrow alley bars", duration: "2h", food: "Order yakitori and highballs at each stop", cost: "€25" },
    ],
  },
  {
    day: 3, date: "Oct 3", city: "Tokyo",
    activities: [
      { name: "Meiji Shrine", category: "culture", icon: "⛩️", why: "Serene Shinto shrine in a 170-acre forest in the heart of the city", duration: "1.5h", cost: "Free", tip: "Write a wish on an ema (wooden plaque) for ¥500" },
      { name: "Harajuku & Takeshita Street", category: "explore", icon: "🛍️", why: "Tokyo's youth fashion epicenter — vibrant, colorful, unique", duration: "2h", food: "Get a rainbow cotton candy crepe from Marion Crepes", cost: "Free (browsing)" },
      { name: "Shinjuku Gyoen National Garden", category: "nature", icon: "🌿", why: "Beautifully landscaped garden blending Japanese, English, and French styles", duration: "1.5h", cost: "€4" },
      { name: "Golden Gai Night Out", category: "nightlife", icon: "🌃", why: "200+ tiny bars in narrow alleys — each seats 6–8 people", duration: "2h", tip: "Some bars charge a seating fee (¥500–1000); check the door sign", cost: "€20" },
    ],
  },
  {
    day: 4, date: "Oct 4", city: "Tokyo",
    activities: [
      { name: "Day Trip to Kamakura", category: "culture", icon: "🗿", why: "See the Great Buddha and beautiful coastal temples — 1hr from Tokyo", duration: "6h", cost: "€15 (train)", tip: "Take the Enoden line for scenic coastal views" },
      { name: "Kamakura Street Food", category: "food", icon: "🍡", why: "Komachi-dori street is lined with local snacks and crafts", duration: "1h", food: "Try shirasu (whitebait) rice bowl — a Kamakura specialty", cost: "€10" },
      { name: "Sunset at Yuigahama Beach", category: "nature", icon: "🌅", why: "Peaceful beach with views of Enoshima island at sunset", duration: "1h", cost: "Free" },
    ],
  },
  {
    day: 5, date: "Oct 5", city: "Tokyo",
    activities: [
      { name: "Toyosu Fish Market Auction", category: "culture", icon: "🐟", why: "Watch the famous tuna auction from the observation deck", duration: "2h", tip: "Viewing deck opens at 5:30am — get there by 5am", cost: "Free" },
      { name: "Odaiba Waterfront", category: "explore", icon: "🌊", why: "Futuristic island district with views of Rainbow Bridge and a mini Statue of Liberty", duration: "2h", cost: "Free" },
      { name: "Shopping in Ginza", category: "explore", icon: "🛍️", why: "Tokyo's luxury shopping district — window shopping is an experience itself", duration: "2h", cost: "Free (browsing)" },
      { name: "Farewell Sushi Omakase", category: "food", icon: "🍣", why: "End Tokyo on a high — a proper omakase experience", duration: "1.5h", food: "Sushi Saito or any mid-range omakase in Ginza", cost: "€50–80" },
    ],
  },

  // === KYOTO (Days 6–8) ===
  {
    day: 6, date: "Oct 6", city: "Kyoto", isTravel: true, travelFrom: "Tokyo", travelTo: "Kyoto", travelDuration: "2h 15min (Shinkansen)",
    activities: [
      { name: "Shinkansen to Kyoto", category: "transport", icon: "🚅", why: "The bullet train experience is a highlight in itself — 300km/h through the countryside", duration: "2h 15min", cost: "€120", tip: "Book a window seat on the right side for Mt. Fuji views" },
      { name: "Fushimi Inari Shrine", category: "culture", icon: "⛩️", why: "10,000 vermillion torii gates winding up a mountainside — Kyoto's #1 sight", duration: "2.5h", cost: "Free", tip: "Hike past the midpoint where 90% of tourists stop" },
      { name: "Nishiki Market", category: "food", icon: "🍢", why: "'Kyoto's Kitchen' — 5 blocks of food stalls and local specialties", duration: "1.5h", food: "Try yuba (tofu skin), matcha sweets, and grilled mochi", cost: "€15" },
    ],
  },
  {
    day: 7, date: "Oct 7", city: "Kyoto",
    activities: [
      { name: "Arashiyama Bamboo Grove", category: "nature", icon: "🎋", why: "Walk through towering bamboo stalks — ethereal in morning light", duration: "1.5h", cost: "Free", tip: "Arrive by 7am for photos without crowds" },
      { name: "Tenryu-ji Temple Garden", category: "culture", icon: "🏯", why: "UNESCO World Heritage garden dating to 1339 — best zen garden in Kyoto", duration: "1h", cost: "€8" },
      { name: "Kinkaku-ji (Golden Pavilion)", category: "culture", icon: "✨", why: "Gold-leaf covered pavilion reflected in a mirror pond — unforgettable", duration: "1h", cost: "€6" },
      { name: "Gion District Evening Walk", category: "culture", icon: "👘", why: "Kyoto's geisha district — traditional wooden machiya houses and lantern-lit streets", duration: "2h", food: "Try kaiseki (multi-course) dinner at a Gion restaurant", cost: "€40–60" },
    ],
  },
  {
    day: 8, date: "Oct 8", city: "Kyoto",
    activities: [
      { name: "Kiyomizu-dera Temple", category: "culture", icon: "🏯", why: "Wooden temple on a hillside with panoramic views of the city", duration: "2h", cost: "€6", tip: "The surrounding Higashiyama district is perfect for pottery shopping" },
      { name: "Tea Ceremony Experience", category: "culture", icon: "🍵", why: "Participate in a traditional Japanese tea ceremony — a meditative, cultural highlight", duration: "1.5h", cost: "€30", tip: "Book at Camellia near Kiyomizu-dera" },
      { name: "Philosopher's Path", category: "nature", icon: "🌸", why: "Stone-lined canal path connecting temples — peaceful and scenic", duration: "1.5h", cost: "Free" },
    ],
  },

  // === HANOI (Days 9–11) ===
  {
    day: 9, date: "Oct 9", city: "Hanoi", isTravel: true, travelFrom: "Kyoto", travelTo: "Hanoi", travelDuration: "6h (flight via Osaka-KIX)",
    activities: [
      { name: "Flight to Hanoi", category: "transport", icon: "✈️", why: "Fly from Kansai (KIX) to Noi Bai — budget airlines offer good fares", duration: "5h", cost: "€180", tip: "Pre-arrange airport transfer via Grab app" },
      { name: "Hoan Kiem Lake Evening Walk", category: "explore", icon: "🌙", why: "The spiritual heart of Hanoi — beautiful when lit up at night", duration: "1.5h", cost: "Free", food: "Get egg coffee at Cafe Giang nearby" },
    ],
  },
  {
    day: 10, date: "Oct 10", city: "Hanoi",
    activities: [
      { name: "Old Quarter Walking Tour", category: "explore", icon: "🚶", why: "36 streets, each named after the goods once sold there — chaotic and charming", duration: "3h", cost: "Free (self-guided)", tip: "Start at Dong Xuan Market and zigzag south" },
      { name: "Street Food Tour", category: "food", icon: "🍜", why: "Hanoi's street food is legendary — pho, bun cha, banh mi on every corner", duration: "2h", food: "Bun Cha Huong Lien (Obama's bun cha spot) is a must", cost: "€8" },
      { name: "Ho Chi Minh Mausoleum", category: "culture", icon: "🏛️", why: "Historic monument to Vietnam's founding father — impressive architecture", duration: "1.5h", cost: "Free", tip: "Open mornings only (Tue–Thu, Sat–Sun). Dress modestly." },
      { name: "Train Street", category: "explore", icon: "🚂", why: "Houses line an active railway — trains pass inches from front doors", duration: "1h", cost: "Free", tip: "Check train schedule online — trains pass around 3:30pm and 7:30pm" },
    ],
  },
  {
    day: 11, date: "Oct 11", city: "Hanoi",
    activities: [
      { name: "Temple of Literature", category: "culture", icon: "📚", why: "Vietnam's first university (1076) — serene courtyards and ancient architecture", duration: "1.5h", cost: "€3" },
      { name: "Vietnamese Cooking Class", category: "food", icon: "👨‍🍳", why: "Learn to make pho, spring rolls, and banh xeo from a local chef", duration: "3h", cost: "€25", food: "You eat everything you cook — the best lunch in Hanoi" },
      { name: "Water Puppet Show", category: "culture", icon: "🎭", why: "Traditional Vietnamese art form — puppets dance on water to live music", duration: "1h", cost: "€5", tip: "Book Thang Long Theatre — shows at 4pm, 5pm, 6:30pm, 8pm" },
    ],
  },

  // === HA LONG BAY (Days 12–13) ===
  {
    day: 12, date: "Oct 12", city: "Ha Long Bay", isTravel: true, travelFrom: "Hanoi", travelTo: "Ha Long Bay", travelDuration: "3.5h (shuttle bus)",
    activities: [
      { name: "Shuttle to Ha Long Bay", category: "transport", icon: "🚌", why: "Most cruise operators include pickup from Hanoi Old Quarter", duration: "3.5h", cost: "Included in cruise" },
      { name: "Overnight Cruise Check-in", category: "explore", icon: "🚢", why: "Board a traditional junk boat and cruise through 1,600 limestone karsts", duration: "2h", cost: "€120 (full cruise)", tip: "Book a mid-range boat (not budget) — the food and rooms are worth it" },
      { name: "Kayaking Through Karsts", category: "adventure", icon: "🛶", why: "Paddle through caves and hidden lagoons surrounded by towering limestone", duration: "1.5h", cost: "Included" },
      { name: "Sunset on the Deck", category: "nature", icon: "🌅", why: "Watch the sun set over thousands of limestone pillars — unforgettable", duration: "1h", food: "Fresh seafood dinner is served onboard", cost: "Included" },
    ],
  },
  {
    day: 13, date: "Oct 13", city: "Ha Long Bay",
    activities: [
      { name: "Sunrise Tai Chi on Deck", category: "wellness", icon: "🧘", why: "Start the day with tai chi as mist rises over the bay", duration: "45min", cost: "Included" },
      { name: "Sung Sot Cave Visit", category: "nature", icon: "🪨", why: "One of Ha Long Bay's largest and most spectacular caves", duration: "1.5h", cost: "Included" },
      { name: "Return to Hanoi + Flight to Bangkok", category: "transport", icon: "✈️", why: "Shuttle back to Hanoi, then evening flight to Bangkok", duration: "8h total", cost: "€130 (flight)", tip: "Book an evening flight to maximize your bay time" },
    ],
  },

  // === BANGKOK (Days 14–17) ===
  {
    day: 14, date: "Oct 14", city: "Bangkok", isTravel: true, travelFrom: "Ha Long Bay", travelTo: "Bangkok", travelDuration: "Evening arrival",
    activities: [
      { name: "Arrive in Bangkok", category: "transport", icon: "✈️", why: "Evening arrival — take the Airport Rail Link to the city center", duration: "1h", cost: "€2", tip: "Buy a Rabbit card at the airport for BTS/MRT" },
      { name: "Khao San Road Night Walk", category: "nightlife", icon: "🌃", why: "Bangkok's legendary backpacker street — buzzing with energy at night", duration: "2h", food: "Pad thai from a street cart + mango sticky rice", cost: "€8" },
    ],
  },
  {
    day: 15, date: "Oct 15", city: "Bangkok",
    activities: [
      { name: "Grand Palace & Wat Phra Kaew", category: "culture", icon: "🏯", why: "Thailand's most sacred temple and the dazzling former royal residence", duration: "3h", cost: "€15", tip: "Dress code enforced — long pants and covered shoulders required" },
      { name: "Wat Pho (Reclining Buddha)", category: "culture", icon: "🙏", why: "46-meter gold reclining Buddha — the birthplace of Thai massage", duration: "1.5h", cost: "€6", tip: "Get a traditional Thai massage here (€10 for 1 hour)" },
      { name: "Chao Phraya River Boat", category: "explore", icon: "⛴️", why: "Take the public ferry — a cheap and scenic way to see riverside temples", duration: "1h", cost: "€0.50" },
      { name: "Chinatown (Yaowarat) Night Market", category: "food", icon: "🥘", why: "Bangkok's best street food — Chinese-Thai fusion under neon signs", duration: "2h", food: "Oyster omelette, roasted duck, and mango sticky rice", cost: "€10" },
    ],
  },
  {
    day: 16, date: "Oct 16", city: "Bangkok",
    activities: [
      { name: "Chatuchak Weekend Market", category: "explore", icon: "🛍️", why: "15,000+ stalls — the world's largest outdoor market", duration: "3h", cost: "Free (entry)", tip: "Go early (9am) to beat the heat. Sections 2–4 for clothing, 7 for art" },
      { name: "Jim Thompson House", category: "culture", icon: "🏠", why: "Beautiful traditional Thai house museum of the 'Silk King'", duration: "1.5h", cost: "€8" },
      { name: "Rooftop Bar Sunset", category: "nightlife", icon: "🍸", why: "Bangkok is famous for its rooftop bars — panoramic city views at golden hour", duration: "2h", food: "Cocktails at Vertigo & Moon Bar or Sky Bar (Lebua)", cost: "€15–25" },
    ],
  },
  {
    day: 17, date: "Oct 17", city: "Bangkok",
    activities: [
      { name: "Floating Market Day Trip", category: "explore", icon: "🛶", why: "Damnoen Saduak — colorful boats selling fruit, food, and souvenirs on the canal", duration: "4h", cost: "€20 (tour)", tip: "Go with a small-group tour to avoid the tourist trap boats", food: "Boat noodles are the must-try here" },
      { name: "Thai Cooking Class", category: "food", icon: "👨‍🍳", why: "Learn to make green curry, tom yum, and pad thai from scratch", duration: "3h", cost: "€30", food: "You eat a full 4-course meal that you cooked" },
    ],
  },

  // === CHIANG MAI (Days 18–20) ===
  {
    day: 18, date: "Oct 18", city: "Chiang Mai", isTravel: true, travelFrom: "Bangkok", travelTo: "Chiang Mai", travelDuration: "1h 15min (flight)",
    activities: [
      { name: "Flight to Chiang Mai", category: "transport", icon: "✈️", why: "Quick domestic flight — budget airlines from ₹800", duration: "1h 15min", cost: "€35" },
      { name: "Old City Temple Walk", category: "culture", icon: "🏯", why: "Chiang Mai's old walled city has 30+ temples within walking distance", duration: "2.5h", cost: "Free", tip: "Start at Wat Chedi Luang, then Wat Phra Singh" },
      { name: "Sunday Night Market", category: "explore", icon: "🏮", why: "Chiang Mai's best night market — handmade crafts, street food, live music", duration: "2h", food: "Khao soi (coconut curry noodles) — Chiang Mai's signature dish", cost: "€5" },
    ],
  },
  {
    day: 19, date: "Oct 19", city: "Chiang Mai",
    activities: [
      { name: "Doi Suthep Temple", category: "culture", icon: "⛩️", why: "Golden mountaintop temple with panoramic views of the city and valley", duration: "3h", cost: "€2", tip: "Climb the 309-step Naga staircase for the full experience" },
      { name: "Elephant Nature Park", category: "nature", icon: "🐘", why: "Ethical elephant sanctuary — feed and bathe rescued elephants", duration: "4h", cost: "€60", tip: "Book the half-day morning visit. No riding — this is a rescue sanctuary." },
    ],
  },
  {
    day: 20, date: "Oct 20", city: "Chiang Mai",
    activities: [
      { name: "Doi Inthanon National Park", category: "nature", icon: "🏔️", why: "Thailand's highest peak — twin pagodas, cloud forest, and Karen hill tribe villages", duration: "6h", cost: "€25 (tour + entry)", tip: "Bring a light jacket — it's noticeably cooler at 2,565m" },
      { name: "Night Bazaar & Dinner", category: "food", icon: "🍲", why: "Browse handicrafts at the night bazaar, then eat at a riverside restaurant", duration: "2h", food: "Try sai oua (northern Thai sausage) and nam prik ong (chili dip)", cost: "€10" },
    ],
  },

  // === PHUKET (Days 21–22) ===
  {
    day: 21, date: "Oct 21", city: "Phuket", isTravel: true, travelFrom: "Chiang Mai", travelTo: "Phuket", travelDuration: "2h (flight)",
    activities: [
      { name: "Flight to Phuket", category: "transport", icon: "✈️", why: "Direct flight to Thailand's beach paradise", duration: "2h", cost: "€45" },
      { name: "Patong Beach Afternoon", category: "nature", icon: "🏖️", why: "Phuket's most famous beach — relax after 3 weeks of adventure", duration: "3h", cost: "Free", tip: "Rent a beach chair and umbrella for ₹200" },
      { name: "Old Phuket Town", category: "explore", icon: "🏘️", why: "Colorful Sino-Portuguese architecture and excellent local restaurants", duration: "2h", food: "Try moo hong (Phuket-style braised pork) at a local shop", cost: "€8" },
    ],
  },
  {
    day: 22, date: "Oct 22", city: "Phuket",
    activities: [
      { name: "Phi Phi Islands Day Trip", category: "adventure", icon: "🏝️", why: "Crystal-clear water, snorkeling, and Maya Bay (The Beach filming location)", duration: "8h", cost: "€55", tip: "Book a speedboat tour, not the big ferry — more time at each stop" },
      { name: "Farewell Sunset Dinner", category: "food", icon: "🌅", why: "End the trip watching the Andaman Sea sunset with fresh seafood", duration: "2h", food: "Grilled prawns and a Chang beer at a beachfront restaurant", cost: "€20" },
    ],
  },
];

// ============================================================
// Visa Data
// ============================================================

export const sampleVisas: VisaInfo[] = [
  {
    country: "Japan", countryCode: "JP", requirement: "visa-free",
    maxStayDays: 90, notes: "No visa required for stays up to 90 days.",
    icon: "✅", label: "Visa-free (90 days)",
    sourceUrl: "https://www.mofa.go.jp/j_info/visit/visa/index.html",
    sourceLabel: "Japan MOFA",
  },
  {
    country: "Vietnam", countryCode: "VN", requirement: "e-visa",
    maxStayDays: 30, processingDays: 5,
    notes: "Apply online before travel. Processing times vary — apply at least 5–7 days ahead.",
    icon: "💻", label: "E-visa required",
    sourceUrl: "https://evisa.xuatnhapcanh.gov.vn",
    sourceLabel: "Vietnam Official E-Visa Portal",
  },
  {
    country: "Thailand", countryCode: "TH", requirement: "visa-free",
    maxStayDays: 30, notes: "No visa required for stays up to 30 days.",
    icon: "✅", label: "Visa-free (30 days)",
    sourceUrl: "https://www.thaievisa.go.th",
    sourceLabel: "Thailand e-Visa",
  },
];

// ============================================================
// Weather
// ============================================================

export const sampleWeather: CityWeather[] = [
  { city: "Tokyo", temp: "22°C", condition: "Partly cloudy", icon: "⛅" },
  { city: "Kyoto", temp: "21°C", condition: "Sunny", icon: "☀️" },
  { city: "Hanoi", temp: "28°C", condition: "Humid", icon: "🌤️" },
  { city: "Ha Long Bay", temp: "27°C", condition: "Misty", icon: "🌫️" },
  { city: "Bangkok", temp: "32°C", condition: "Hot & humid", icon: "🌡️" },
  { city: "Chiang Mai", temp: "29°C", condition: "Warm", icon: "☀️" },
  { city: "Phuket", temp: "31°C", condition: "Tropical", icon: "🌴" },
];

// ============================================================
// Full sample itinerary — combines all pieces for demo fallback
// ============================================================

export const sampleFullItinerary: Itinerary = {
  route: sampleRoute,
  days: sampleItinerary,
  visaData: sampleVisas,
  weatherData: sampleWeather,
};

// ============================================================
// Dashboard — saved trips
// ============================================================

export const sampleTrips: SavedTrip[] = [
  {
    id: "japan-vietnam-thailand-2026",
    name: "Japan, Vietnam & Thailand",
    countries: 3,
    dates: "Oct 1 – Oct 22, 2026",
    status: "Ready",
  },
  {
    id: "portugal-spain-2026",
    name: "Portugal & Spain",
    countries: 2,
    dates: "Dec 15 – Dec 28, 2026",
    status: "Planning",
  },
];


// ============================================================
// Interest Chips
// ============================================================

export const interestOptions: InterestOption[] = [
  { id: "culture", label: "Culture & History", emoji: "🏛️" },
  { id: "food", label: "Food & Cuisine", emoji: "🍜" },
  { id: "nature", label: "Nature & Hiking", emoji: "🌿" },
  { id: "adventure", label: "Adventure Sports", emoji: "🧗" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "wellness", label: "Wellness & Spa", emoji: "🧘" },
  { id: "art", label: "Art & Design", emoji: "🎨" },
  { id: "beach", label: "Beach & Ocean", emoji: "🏖️" },
];

// ============================================================
// Regions for questionnaire
// ============================================================

export const regions: Region[] = [
  { id: "southeast-asia", name: "Southeast Asia", countries: "Thailand, Vietnam, Cambodia, Indonesia, Philippines", popular: true },
  { id: "east-asia", name: "East Asia", countries: "Japan, South Korea, Taiwan, China", popular: true },
  { id: "south-asia", name: "South Asia", countries: "India, Sri Lanka, Nepal" },
  { id: "europe", name: "Europe", countries: "Spain, Italy, France, Greece, Portugal", popular: true },
  { id: "south-america", name: "South America", countries: "Colombia, Peru, Argentina, Brazil" },
  { id: "central-america", name: "Central America", countries: "Mexico, Costa Rica, Guatemala" },
  { id: "africa", name: "Africa", countries: "Morocco, South Africa, Kenya, Tanzania" },
];
