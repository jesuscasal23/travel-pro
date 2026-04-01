// ============================================================
// Health / Vaccine Requirements — Static Dataset
// Sources: CDC Travelers' Health (wwwnc.cdc.gov/travel), WHO International Travel & Health
// AI-seeded from CDC/WHO knowledge — see TRA-293 for improvement plan
// Last reviewed: 2026-04-01
// ============================================================

import type { HealthRequirement } from "@/types";

export const HEALTH_REQUIREMENTS: Record<string, HealthRequirement[]> = {
  // ── Africa ───────────────────────────────────────────────────────────────────

  AO: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for all travelers." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk throughout. Take antimalarials and use insect repellent.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended for all travelers." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    {
      type: "recommended",
      name: "Typhoid",
      notes: "Recommended due to food/water contamination risk.",
    },
  ],
  BJ: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk throughout. Take antimalarials.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — Benin is in the meningitis belt.",
    },
  ],
  BF: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — in the meningitis belt.",
    },
  ],
  CM: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  CF: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  TD: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk in south; lower risk in north.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — in the meningitis belt.",
    },
  ],
  CG: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  CD: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for extended stays or rural travel." },
  ],
  CI: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  ET: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Required if arriving from a Yellow Fever endemic country. Recommended for travel to low-altitude areas.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in areas below 2,500m. Not present in Addis Ababa.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel or extended stays." },
  ],
  GQ: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  GA: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  GH: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — in the meningitis belt.",
    },
  ],
  GN: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  GW: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  KE: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from a Yellow Fever endemic country.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, except Nairobi and areas above 2,500m. Take antimalarials.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Consider for extended stays or rural/wildlife areas.",
    },
  ],
  LR: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  ML: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk in south during rainy season.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — in the meningitis belt.",
    },
  ],
  MA: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended for all travelers." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  MR: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from endemic countries.",
    },
    { type: "recommended", name: "Malaria prophylaxis", notes: "Risk in southern regions." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  MZ: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from endemic countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk throughout, including cities. Take antimalarials.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  MW: [
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk throughout, year-round.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  NE: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk in south during rainy season.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended — in the meningitis belt.",
    },
  ],
  NG: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended for northern regions.",
    },
  ],
  RW: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk below 2,500m. Take antimalarials.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  SN: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, highest during rainy season (Jul–Oct).",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Meningococcal meningitis",
      notes: "Recommended for travel to eastern regions.",
    },
  ],
  SL: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  SS: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  SD: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from endemic countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in many areas, especially southern and central regions.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Meningococcal meningitis", notes: "Recommended." },
  ],
  TZ: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Certificate required if arriving from endemic countries. Recommended for travel to low-altitude areas including Zanzibar.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk throughout, including Zanzibar and Kilimanjaro base.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel or wildlife areas." },
  ],
  TG: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  TN: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended for all travelers." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  UG: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  ZA: [
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Limpopo, Mpumalanga (Kruger), and KwaZulu-Natal coast. Not required in Cape Town, Johannesburg, or Garden Route.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    { type: "recommended", name: "Typhoid", notes: "Recommended for travel outside major cities." },
  ],
  ZM: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from endemic countries.",
    },
    { type: "recommended", name: "Malaria prophylaxis", notes: "High risk throughout." },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  ZW: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes: "Certificate required if arriving from endemic countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, especially Zambezi Valley and Victoria Falls.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],

  // ── Asia ─────────────────────────────────────────────────────────────────────

  BD: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended — high risk from food/water." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in Chittagong Hill Tracts and some border areas.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider — rabies is endemic." },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel, especially during monsoon.",
    },
  ],
  KH: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in rural areas, especially western provinces near Thailand border. Not required in Phnom Penh or Siem Reap (Angkor Wat).",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for extended stays or rural travel." },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel, especially June–October.",
    },
  ],
  CN: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended for travel outside major cities." },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel to endemic areas, May–October.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Limited risk in Yunnan and Hainan provinces only. Not required elsewhere.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  IN: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended for all travelers." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended — high risk from food/water." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, except high-altitude areas. Take antimalarials.",
    },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Recommended for extended stays — India has one of the world's highest rabies rates.",
    },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel, especially in south India and Uttar Pradesh.",
    },
  ],
  ID: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Lombok, Komodo, Papua, and eastern islands. Not required in Bali, Java main cities, or Sumatra cities.",
    },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Consider — Bali has had outbreaks. Recommended for longer stays.",
    },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel or extended stays.",
    },
  ],
  JP: [
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Recommended for extended rural travel. Very low risk for standard city tourism.",
    },
  ],
  LA: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, except Vientiane. Take antimalarials for rural travel.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider." },
    { type: "recommended", name: "Japanese Encephalitis", notes: "Consider for rural travel." },
  ],
  MY: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in rural areas of Sabah, Sarawak, and peninsula interior. Not required in KL, Penang, or Langkawi.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
    { type: "recommended", name: "Japanese Encephalitis", notes: "Consider for rural travel." },
  ],
  MM: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, especially border areas. Take antimalarials.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider." },
    { type: "recommended", name: "Japanese Encephalitis", notes: "Consider for rural travel." },
  ],
  NP: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended — high risk in Kathmandu." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Terai (lowland) areas below 1,200m. Not required in Kathmandu or on main trekking routes.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for extended stays." },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for travel to Terai region.",
    },
  ],
  PK: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended — high risk." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk throughout, especially during and after monsoon.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider." },
  ],
  PH: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in rural Palawan, Mindanao, and other rural islands. Not required in Manila, Cebu, or Boracay.",
    },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Recommended for extended stays — Philippines has significant dog rabies.",
    },
    { type: "recommended", name: "Japanese Encephalitis", notes: "Consider for rural travel." },
  ],
  LK: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in north and east. Low risk in Colombo, Galle, and main southern tourist areas.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider." },
    { type: "recommended", name: "Japanese Encephalitis", notes: "Consider for rural travel." },
  ],
  TH: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    {
      type: "recommended",
      name: "Typhoid",
      notes: "Recommended for travel outside Bangkok and resort areas.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in forested border areas with Myanmar and Cambodia. Not required in Bangkok, Phuket, Pattaya, Chiang Mai, or Koh Samui.",
    },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Consider for extended stays or animal contact.",
    },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural or agricultural areas.",
    },
  ],
  VN: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in rural highlands and border areas. Not required in Hanoi, Ho Chi Minh City, or coastal tourist areas.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for extended stays." },
    {
      type: "recommended",
      name: "Japanese Encephalitis",
      notes: "Consider for rural travel, especially May–October.",
    },
  ],

  // ── Middle East ──────────────────────────────────────────────────────────────

  EG: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Very limited risk only in El Faiyum province (June–October).",
    },
  ],
  JO: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  TR: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    {
      type: "recommended",
      name: "Typhoid",
      notes: "Recommended for travel outside major tourist areas.",
    },
  ],

  // ── Americas ─────────────────────────────────────────────────────────────────

  BO: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel to Amazon basin (Beni, Santa Cruz lowlands). Certificate may be required when continuing to neighboring countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in Amazon lowlands below 2,500m. Not required in La Paz or Sucre.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  BR: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel to Amazon region, Pantanal, and many states. Certificate required when continuing to certain countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Amazon region (Acre, Amazonas, Pará, etc.). Not required in Rio, São Paulo, or coastal cities.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended for travel outside major cities." },
    {
      type: "recommended",
      name: "Rabies",
      notes: "Consider for rural travel or bat exposure risk.",
    },
  ],
  CO: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel to low-altitude areas east of the Andes. Required if continuing to certain neighboring countries.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in Amazon, Pacific coast, and rural areas below 1,700m.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  CR: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Very low risk; limited to remote rural areas.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for jungle/rural travel." },
  ],
  CU: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  EC: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel east of the Andes (Amazon basin). Certificate may be required when traveling onward.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Amazon and coastal lowlands below 1,500m. Not required in Quito or Galápagos.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  GF: [
    { type: "required", name: "Yellow Fever", notes: "Certificate required for entry." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "High risk in interior rainforest areas.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  GT: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes: "Risk in rural areas below 1,500m, especially Pacific coast and northern Petén.",
    },
    { type: "recommended", name: "Rabies", notes: "Consider for rural travel." },
  ],
  MX: [
    { type: "recommended", name: "Hepatitis A", notes: "Recommended for all travelers." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended for longer stays." },
    {
      type: "recommended",
      name: "Typhoid",
      notes: "Recommended, especially outside major tourist resorts.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Limited risk in rural areas of Chiapas, Oaxaca, Sinaloa, and Nayarit. Not required in Mexico City, Cancún, or beach resorts.",
    },
  ],
  PA: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel to Darién province and eastern Panama. Required if continuing to Colombia.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Darién, parts of Bocas del Toro, and some indigenous areas. Not required in Panama City.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
  ],
  PE: [
    {
      type: "recommended",
      name: "Yellow Fever",
      notes:
        "Recommended for travel to Amazon jungle areas below 2,300m. Certificate may be required when traveling onward.",
    },
    {
      type: "recommended",
      name: "Malaria prophylaxis",
      notes:
        "Risk in Amazon basin (Loreto, etc.). Not required in Lima, Machu Picchu, or highland areas.",
    },
    { type: "recommended", name: "Hepatitis A", notes: "Recommended." },
    { type: "recommended", name: "Hepatitis B", notes: "Recommended." },
    { type: "recommended", name: "Typhoid", notes: "Recommended." },
    { type: "recommended", name: "Rabies", notes: "Consider for jungle travel." },
  ],
};
