import type { CityWeather, VisaInfo, CityStop, TripDay } from "@/types";

export interface PackingItem {
  id: string;
  label: string;
  category: "clothing" | "toiletries" | "electronics" | "documents" | "health" | "misc";
}

const PLUG_TYPES: Record<string, string> = {
  JP: "A/B", VN: "A/C", TH: "A/B/C", DE: "C/F", FR: "C/E",
  ES: "C/F", IT: "C/F/L", GB: "G", US: "A/B", KR: "C/F",
  IN: "C/D/M", AU: "I", CN: "A/C/I", SG: "G", MY: "G",
  ID: "C/F", PH: "A/B", KH: "A/C/G", MM: "C/D/F/G",
};

const SE_ASIA = new Set(["TH", "VN", "KH", "ID", "PH", "MM", "LA", "MY", "SG"]);

function parseTemp(temp: string): number {
  const match = temp.match(/(\d+)/);
  return match ? parseInt(match[1]) : 25;
}

export function generatePackingList(
  weatherData: CityWeather[],
  visaData: VisaInfo[],
  route: CityStop[],
  days: TripDay[]
): PackingItem[] {
  const items: PackingItem[] = [];
  const seen = new Set<string>();
  const add = (id: string, label: string, category: PackingItem["category"]) => {
    if (!seen.has(id)) {
      seen.add(id);
      items.push({ id, label, category });
    }
  };

  // Base items
  add("passport", "Passport (valid 6+ months)", "documents");
  add("insurance", "Travel insurance printout", "documents");
  add("phone-charger", "Phone + charger", "electronics");
  add("day-pack", "Day backpack", "misc");
  add("water-bottle", "Reusable water bottle", "misc");
  add("walking-shoes", "Comfortable walking shoes", "clothing");

  // Weather-driven
  const temps = weatherData.map((w) => parseTemp(w.temp));
  const conditions = weatherData.map((w) => w.condition.toLowerCase()).join(" ");

  if (temps.some((t) => t < 20)) {
    add("layers", `Layers for ${weatherData.find((w) => parseTemp(w.temp) < 20)?.city ?? "cooler areas"}`, "clothing");
  }
  if (temps.some((t) => t > 28)) {
    add("sunscreen", "Sunscreen SPF 50", "toiletries");
    add("breathable", "Lightweight breathable clothes", "clothing");
  }
  if (/humid|tropical|rain|monsoon|shower/.test(conditions)) {
    add("umbrella", "Compact umbrella", "misc");
  }

  // Destination-driven
  const countryCodes = new Set(route.map((r) => r.countryCode));
  if ([...countryCodes].some((c) => SE_ASIA.has(c))) {
    add("quick-dry", "Quick-dry clothing", "clothing");
  }

  // Activities-driven
  const allNames = days.flatMap((d) => d.activities.map((a) => a.name.toLowerCase())).join(" ");
  if (/temple|shrine|mosque|church|palace|wat/.test(allNames)) {
    add("modest-cover", "Temple-appropriate clothing", "clothing");
  }
  if (/beach|snorkel|swim|kayak|dive|pool/.test(allNames)) {
    add("swimwear", "Swimwear", "clothing");
  }

  // Plug adapters
  const plugs = [...countryCodes].map((c) => PLUG_TYPES[c]).filter(Boolean);
  const unique = [...new Set(plugs)];
  if (unique.length > 0) {
    add("power-adapter", `Power adapter (Type ${unique.join(", ")})`, "electronics");
  }

  // Visa docs
  if (visaData.some((v) => v.requirement === "e-visa" || v.requirement === "eta")) {
    add("visa-printout", "Printed visa/eTA confirmation", "documents");
  }

  // Duration-driven
  if (days.length > 14) {
    add("laundry-kit", "Travel laundry kit", "misc");
  }

  add("first-aid", "Basic first-aid kit", "health");
  add("medications", "Personal medications", "health");

  return items;
}
