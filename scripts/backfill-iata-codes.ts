/**
 * Backfill missing IATA codes on existing itineraries.
 *
 * Reads all active itineraries, checks each CityStop in the route,
 * and fills in iataCode from the city-iata-map where missing.
 *
 * Usage:
 *   npx tsx scripts/backfill-iata-codes.ts              # dry-run (default)
 *   npx tsx scripts/backfill-iata-codes.ts --write       # actually update DB
 *
 * Requires DATABASE_URL in .env.local.
 */
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Inline the lookup to avoid import issues with tsx and path aliases
const CITY_IATA_MAP: Record<string, string> = {
  london: "LHR",
  paris: "CDG",
  amsterdam: "AMS",
  berlin: "BER",
  rome: "FCO",
  barcelona: "BCN",
  madrid: "MAD",
  lisbon: "LIS",
  vienna: "VIE",
  prague: "PRG",
  budapest: "BUD",
  zurich: "ZRH",
  geneva: "GVA",
  brussels: "BRU",
  stockholm: "ARN",
  copenhagen: "CPH",
  oslo: "OSL",
  helsinki: "HEL",
  athens: "ATH",
  istanbul: "IST",
  dublin: "DUB",
  warsaw: "WAW",
  krakow: "KRK",
  dubrovnik: "DBV",
  split: "SPU",
  santorini: "JTR",
  mykonos: "JMK",
  nice: "NCE",
  venice: "VCE",
  florence: "FLR",
  milan: "MXP",
  edinburgh: "EDI",
  reykjavik: "KEF",
  porto: "OPO",
  seville: "SVQ",
  valencia: "VLC",
  lyon: "LYS",
  marseille: "MRS",
  frankfurt: "FRA",
  munich: "MUC",
  hamburg: "HAM",
  bern: "BRN",
  salzburg: "SZG",
  innsbruck: "INN",
  riga: "RIX",
  tallinn: "TLL",
  vilnius: "VNO",
  sofia: "SOF",
  bucharest: "OTP",
  belgrade: "BEG",
  zagreb: "ZAG",
  sarajevo: "SJJ",
  tirana: "TIA",
  skopje: "SKP",
  podgorica: "TGD",
  luxembourg: "LUX",
  valletta: "MLA",
  nicosia: "LCA",
  tokyo: "NRT",
  osaka: "KIX",
  kyoto: "ITM",
  hiroshima: "HIJ",
  sapporo: "CTS",
  fukuoka: "FUK",
  nagoya: "NGO",
  naha: "OKA",
  seoul: "ICN",
  busan: "PUS",
  jeju: "CJU",
  beijing: "PEK",
  shanghai: "PVG",
  guangzhou: "CAN",
  shenzhen: "SZX",
  chengdu: "CTU",
  chongqing: "CKG",
  "xi'an": "XIY",
  xian: "XIY",
  guilin: "KWL",
  "hong kong": "HKG",
  hongkong: "HKG",
  macau: "MFM",
  taipei: "TPE",
  kaohsiung: "KHH",
  ulaanbaatar: "ULN",
  singapore: "SIN",
  bangkok: "BKK",
  "chiang mai": "CNX",
  phuket: "HKT",
  "koh samui": "USM",
  krabi: "KBV",
  hanoi: "HAN",
  "ho chi minh city": "SGN",
  "ho chi minh": "SGN",
  saigon: "SGN",
  "da nang": "DAD",
  danang: "DAD",
  "hoi an": "DAD",
  hue: "HUI",
  "nha trang": "CXR",
  "phu quoc": "PQC",
  "kuala lumpur": "KUL",
  penang: "PEN",
  "kota kinabalu": "BKI",
  langkawi: "LGK",
  jakarta: "CGK",
  bali: "DPS",
  denpasar: "DPS",
  yogyakarta: "YIA",
  lombok: "LOP",
  "labuan bajo": "LBJ",
  manila: "MNL",
  cebu: "CEB",
  "el nido": "ENI",
  boracay: "MPH",
  "phnom penh": "PNH",
  "siem reap": "REP",
  vientiane: "VTE",
  "luang prabang": "LPQ",
  yangon: "RGN",
  mandalay: "MDL",
  delhi: "DEL",
  "new delhi": "DEL",
  mumbai: "BOM",
  bangalore: "BLR",
  bengaluru: "BLR",
  chennai: "MAA",
  kolkata: "CCU",
  goa: "GOI",
  jaipur: "JAI",
  agra: "AGR",
  varanasi: "VNS",
  kochi: "COK",
  hyderabad: "HYD",
  ahmedabad: "AMD",
  amritsar: "ATQ",
  kathmandu: "KTM",
  colombo: "CMB",
  dhaka: "DAC",
  karachi: "KHI",
  lahore: "LHE",
  islamabad: "ISB",
  tashkent: "TAS",
  samarkand: "SKD",
  almaty: "ALA",
  astana: "NQZ",
  tbilisi: "TBS",
  yerevan: "EVN",
  baku: "GYD",
  dubai: "DXB",
  "abu dhabi": "AUH",
  doha: "DOH",
  muscat: "MCT",
  riyadh: "RUH",
  jeddah: "JED",
  amman: "AMM",
  "tel aviv": "TLV",
  jerusalem: "TLV",
  beirut: "BEY",
  tehran: "IKA",
  baghdad: "BGW",
  kuwait: "KWI",
  "kuwait city": "KWI",
  cairo: "CAI",
  luxor: "LXR",
  "sharm el sheikh": "SSH",
  marrakech: "RAK",
  marrakesh: "RAK",
  casablanca: "CMN",
  fez: "FEZ",
  tunis: "TUN",
  algiers: "ALG",
  nairobi: "NBO",
  mombasa: "MBA",
  zanzibar: "ZNZ",
  "dar es salaam": "DAR",
  arusha: "ARK",
  kampala: "EBB",
  kigali: "KGL",
  "addis ababa": "ADD",
  accra: "ACC",
  lagos: "LOS",
  abuja: "ABV",
  dakar: "DSS",
  "cape town": "CPT",
  johannesburg: "JNB",
  durban: "DUR",
  "victoria falls": "VFA",
  windhoek: "WDH",
  lusaka: "LUN",
  harare: "HRE",
  antananarivo: "TNR",
  mauritius: "MRU",
  seychelles: "SEZ",
  "new york": "JFK",
  newyork: "JFK",
  "los angeles": "LAX",
  "san francisco": "SFO",
  chicago: "ORD",
  miami: "MIA",
  "las vegas": "LAS",
  "new orleans": "MSY",
  washington: "DCA",
  "washington dc": "DCA",
  boston: "BOS",
  seattle: "SEA",
  denver: "DEN",
  atlanta: "ATL",
  dallas: "DFW",
  houston: "IAH",
  phoenix: "PHX",
  portland: "PDX",
  nashville: "BNA",
  charleston: "CHS",
  savannah: "SAV",
  orlando: "MCO",
  "san diego": "SAN",
  honolulu: "HNL",
  maui: "OGG",
  anchorage: "ANC",
  vancouver: "YVR",
  toronto: "YYZ",
  montreal: "YUL",
  calgary: "YYC",
  ottawa: "YOW",
  quebec: "YQB",
  "mexico city": "MEX",
  cancun: "CUN",
  tulum: "CUN",
  "playa del carmen": "CUN",
  guadalajara: "GDL",
  monterrey: "MTY",
  oaxaca: "OAX",
  havana: "HAV",
  "panama city": "PTY",
  bogota: "BOG",
  cartagena: "CTG",
  medellin: "MDE",
  lima: "LIM",
  cusco: "CUZ",
  "machu picchu": "CUZ",
  quito: "UIO",
  galapagos: "GPS",
  "buenos aires": "EZE",
  santiago: "SCL",
  "rio de janeiro": "GIG",
  "sao paulo": "GRU",
  "são paulo": "GRU",
  montevideo: "MVD",
  asuncion: "ASU",
  "la paz": "LPB",
  caracas: "CCS",
  sydney: "SYD",
  melbourne: "MEL",
  brisbane: "BNE",
  perth: "PER",
  adelaide: "ADL",
  cairns: "CNS",
  darwin: "DRW",
  "gold coast": "OOL",
  auckland: "AKL",
  queenstown: "ZQN",
  christchurch: "CHC",
  wellington: "WLG",
  fiji: "NAN",
  nadi: "NAN",
  tahiti: "PPT",
};

function lookupIata(city: string): string | undefined {
  return CITY_IATA_MAP[city.toLowerCase().trim()];
}

interface CityStop {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  days: number;
  countryCode: string;
  iataCode?: string;
}

interface ItineraryData {
  route: CityStop[];
  [key: string]: unknown;
}

interface ItineraryRow {
  id: string;
  tripId: string;
  data: ItineraryData;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes("--write");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set. Add it to .env.local.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const itineraries = (await prisma.itinerary.findMany({
      where: { isActive: true },
      select: { id: true, tripId: true, data: true },
    })) as unknown as ItineraryRow[];

    console.log(`Found ${itineraries.length} active itineraries\n`);

    let totalUpdated = 0;
    let totalStopsFixed = 0;
    const unresolved: string[] = [];

    for (const itin of itineraries) {
      const data = itin.data;
      if (!data?.route) continue;

      let changed = false;
      for (const stop of data.route) {
        if (!stop.iataCode) {
          const iata = lookupIata(stop.city);
          if (iata) {
            console.log(`  [${itin.tripId}] ${stop.city} → ${iata}`);
            stop.iataCode = iata;
            changed = true;
            totalStopsFixed++;
          } else {
            unresolved.push(`${stop.city} (trip ${itin.tripId})`);
          }
        }
      }

      if (changed) {
        totalUpdated++;
        if (shouldWrite) {
          await prisma.itinerary.update({
            where: { id: itin.id },
            data: { data: data as object },
          });
        }
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Itineraries needing update: ${totalUpdated}`);
    console.log(`City stops fixed: ${totalStopsFixed}`);
    if (unresolved.length > 0) {
      console.log(`\nCould not resolve IATA for:`);
      for (const city of unresolved) {
        console.log(`  - ${city}`);
      }
    }

    if (!shouldWrite && totalUpdated > 0) {
      console.log(`\nDry run — no changes written. Re-run with --write to apply.`);
    } else if (shouldWrite && totalUpdated > 0) {
      console.log(`\n✓ ${totalUpdated} itineraries updated in the database.`);
    } else {
      console.log(`\nNo itineraries need updating.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
