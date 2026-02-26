/**
 * One-time script to expand the cities database.
 * Run with: npx tsx scripts/expand-cities.ts
 * Then delete this file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface NewCity {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

// ── New cities to add, grouped by the comment marker they should be inserted after ──
// Key = exact line content to search for (the last city line before the next section comment)
// The new cities will be inserted after matching the section marker

const NEW_CITIES: NewCity[] = [
  // ── JAPAN ──
  { city: "Aomori", country: "Japan", countryCode: "JP", lat: 40.82, lng: 140.74 },
  { city: "Himeji", country: "Japan", countryCode: "JP", lat: 34.82, lng: 134.69 },
  { city: "Okayama", country: "Japan", countryCode: "JP", lat: 34.66, lng: 133.93 },
  { city: "Takamatsu", country: "Japan", countryCode: "JP", lat: 34.34, lng: 134.05 },
  { city: "Tokushima", country: "Japan", countryCode: "JP", lat: 34.07, lng: 134.56 },
  { city: "Kochi", country: "Japan", countryCode: "JP", lat: 33.56, lng: 133.53 },
  { city: "Niigata", country: "Japan", countryCode: "JP", lat: 37.92, lng: 139.04 },
  { city: "Shizuoka", country: "Japan", countryCode: "JP", lat: 34.98, lng: 138.38 },
  { city: "Atami", country: "Japan", countryCode: "JP", lat: 35.1, lng: 139.07 },
  { city: "Ise", country: "Japan", countryCode: "JP", lat: 34.49, lng: 136.71 },
  { city: "Shirakawa-go", country: "Japan", countryCode: "JP", lat: 36.26, lng: 136.91 },
  { city: "Yakushima", country: "Japan", countryCode: "JP", lat: 30.35, lng: 130.51 },
  { city: "Tottori", country: "Japan", countryCode: "JP", lat: 35.5, lng: 134.24 },
  { city: "Hakodate", country: "Japan", countryCode: "JP", lat: 41.77, lng: 140.73 },
  { city: "Otaru", country: "Japan", countryCode: "JP", lat: 43.19, lng: 140.99 },
  { city: "Furano", country: "Japan", countryCode: "JP", lat: 43.34, lng: 142.38 },
  { city: "Miyako Island", country: "Japan", countryCode: "JP", lat: 24.79, lng: 125.28 },
  { city: "Wakayama", country: "Japan", countryCode: "JP", lat: 34.23, lng: 135.17 },

  // ── SOUTH KOREA ──
  { city: "Gwangju", country: "South Korea", countryCode: "KR", lat: 35.16, lng: 126.85 },
  { city: "Chuncheon", country: "South Korea", countryCode: "KR", lat: 37.88, lng: 127.73 },
  { city: "Yeosu", country: "South Korea", countryCode: "KR", lat: 34.74, lng: 127.74 },
  { city: "Gyeonggi", country: "South Korea", countryCode: "KR", lat: 37.27, lng: 127.01 },
  { city: "Ulsan", country: "South Korea", countryCode: "KR", lat: 35.54, lng: 129.31 },
  { city: "Damyang", country: "South Korea", countryCode: "KR", lat: 35.32, lng: 126.99 },
  { city: "Hadong", country: "South Korea", countryCode: "KR", lat: 35.07, lng: 127.75 },
  { city: "Boseong", country: "South Korea", countryCode: "KR", lat: 34.77, lng: 127.08 },

  // ── TAIWAN ──
  { city: "Taroko Gorge", country: "Taiwan", countryCode: "TW", lat: 24.17, lng: 121.49 },
  { city: "Yehliu", country: "Taiwan", countryCode: "TW", lat: 25.21, lng: 121.69 },
  { city: "Lukang", country: "Taiwan", countryCode: "TW", lat: 24.06, lng: 120.43 },
  { city: "Green Island", country: "Taiwan", countryCode: "TW", lat: 22.66, lng: 121.49 },
  { city: "Kinmen", country: "Taiwan", countryCode: "TW", lat: 24.45, lng: 118.38 },

  // ── CHINA ──
  { city: "Jiuzhaigou", country: "China", countryCode: "CN", lat: 33.26, lng: 103.92 },
  { city: "Emeishan", country: "China", countryCode: "CN", lat: 29.6, lng: 103.33 },
  { city: "Zhangye", country: "China", countryCode: "CN", lat: 38.93, lng: 100.45 },
  { city: "Fenghuang", country: "China", countryCode: "CN", lat: 27.93, lng: 109.6 },
  { city: "Datong", country: "China", countryCode: "CN", lat: 40.09, lng: 113.3 },
  { city: "Leshan", country: "China", countryCode: "CN", lat: 29.55, lng: 103.77 },
  { city: "Turpan", country: "China", countryCode: "CN", lat: 42.95, lng: 89.19 },
  { city: "Kashgar", country: "China", countryCode: "CN", lat: 39.47, lng: 75.99 },
  { city: "Chaozhou", country: "China", countryCode: "CN", lat: 23.66, lng: 116.62 },
  { city: "Shangri-La", country: "China", countryCode: "CN", lat: 27.83, lng: 99.7 },
  { city: "Tiger Leaping Gorge", country: "China", countryCode: "CN", lat: 27.18, lng: 100.11 },
  { city: "Wuyuan", country: "China", countryCode: "CN", lat: 29.25, lng: 117.86 },
  { city: "Haikou", country: "China", countryCode: "CN", lat: 20.02, lng: 110.35 },
  { city: "Lugu Lake", country: "China", countryCode: "CN", lat: 27.71, lng: 100.78 },
  { city: "Kaili", country: "China", countryCode: "CN", lat: 26.58, lng: 107.98 },

  // ── MONGOLIA ──
  { city: "Terelj", country: "Mongolia", countryCode: "MN", lat: 47.8, lng: 107.42 },
  { city: "Karakorum", country: "Mongolia", countryCode: "MN", lat: 47.2, lng: 102.83 },

  // ── THAILAND ──
  { city: "Nan", country: "Thailand", countryCode: "TH", lat: 18.78, lng: 100.78 },
  { city: "Mae Hong Son", country: "Thailand", countryCode: "TH", lat: 19.3, lng: 97.97 },
  { city: "Koh Yao Noi", country: "Thailand", countryCode: "TH", lat: 8.13, lng: 98.62 },
  { city: "Trang", country: "Thailand", countryCode: "TH", lat: 7.56, lng: 99.61 },
  { city: "Udon Thani", country: "Thailand", countryCode: "TH", lat: 17.42, lng: 102.79 },
  { city: "Nakhon Ratchasima", country: "Thailand", countryCode: "TH", lat: 14.97, lng: 102.1 },
  { city: "Surin", country: "Thailand", countryCode: "TH", lat: 14.88, lng: 103.49 },
  { city: "Phetchaburi", country: "Thailand", countryCode: "TH", lat: 13.11, lng: 99.94 },
  { city: "Koh Mak", country: "Thailand", countryCode: "TH", lat: 11.82, lng: 102.47 },
  { city: "Koh Kood", country: "Thailand", countryCode: "TH", lat: 11.63, lng: 102.57 },
  { city: "Buriram", country: "Thailand", countryCode: "TH", lat: 14.99, lng: 103.1 },

  // ── VIETNAM ──
  { city: "Bac Ha", country: "Vietnam", countryCode: "VN", lat: 22.54, lng: 104.29 },
  { city: "Tam Coc", country: "Vietnam", countryCode: "VN", lat: 20.22, lng: 105.94 },
  { city: "Ban Gioc", country: "Vietnam", countryCode: "VN", lat: 22.85, lng: 106.72 },
  { city: "Hue Citadel", country: "Vietnam", countryCode: "VN", lat: 16.47, lng: 107.58 },
  { city: "My Son", country: "Vietnam", countryCode: "VN", lat: 15.76, lng: 108.12 },
  { city: "Buon Ma Thuot", country: "Vietnam", countryCode: "VN", lat: 12.67, lng: 108.05 },
  { city: "Vinh", country: "Vietnam", countryCode: "VN", lat: 18.68, lng: 105.68 },
  { city: "Phan Thiet", country: "Vietnam", countryCode: "VN", lat: 10.93, lng: 108.1 },
  { city: "Ly Son Island", country: "Vietnam", countryCode: "VN", lat: 15.38, lng: 109.1 },
  { city: "Da Lat Flower", country: "Vietnam", countryCode: "VN", lat: 11.95, lng: 108.43 },
  { city: "Rach Gia", country: "Vietnam", countryCode: "VN", lat: 10.01, lng: 105.08 },

  // ── INDONESIA ──
  { city: "Bromo", country: "Indonesia", countryCode: "ID", lat: -7.94, lng: 112.95 },
  { city: "Derawan Islands", country: "Indonesia", countryCode: "ID", lat: 2.28, lng: 118.24 },
  { city: "Wakatobi", country: "Indonesia", countryCode: "ID", lat: -5.48, lng: 123.6 },
  { city: "Ternate", country: "Indonesia", countryCode: "ID", lat: 0.79, lng: 127.38 },
  { city: "Manado", country: "Indonesia", countryCode: "ID", lat: 1.47, lng: 124.84 },
  { city: "Bunaken", country: "Indonesia", countryCode: "ID", lat: 1.62, lng: 124.75 },
  { city: "Padang", country: "Indonesia", countryCode: "ID", lat: -0.95, lng: 100.35 },
  { city: "Belitung", country: "Indonesia", countryCode: "ID", lat: -2.75, lng: 107.65 },
  { city: "Karimunjawa", country: "Indonesia", countryCode: "ID", lat: -5.87, lng: 110.4 },
  { city: "Solo", country: "Indonesia", countryCode: "ID", lat: -7.57, lng: 110.82 },
  { city: "Dieng Plateau", country: "Indonesia", countryCode: "ID", lat: -7.21, lng: 109.91 },
  { city: "Wamena", country: "Indonesia", countryCode: "ID", lat: -4.1, lng: 138.94 },
  { city: "Moyo Island", country: "Indonesia", countryCode: "ID", lat: -8.25, lng: 117.53 },
  { city: "Nias Island", country: "Indonesia", countryCode: "ID", lat: 1.1, lng: 97.55 },

  // ── MALAYSIA ──
  { city: "Sabah", country: "Malaysia", countryCode: "MY", lat: 5.31, lng: 116.73 },
  { city: "Semporna", country: "Malaysia", countryCode: "MY", lat: 4.48, lng: 118.61 },
  { city: "Sipadan", country: "Malaysia", countryCode: "MY", lat: 4.11, lng: 118.63 },
  { city: "Taman Negara", country: "Malaysia", countryCode: "MY", lat: 4.38, lng: 102.41 },
  { city: "Pangkor Island", country: "Malaysia", countryCode: "MY", lat: 4.22, lng: 100.55 },
  { city: "Kuala Terengganu", country: "Malaysia", countryCode: "MY", lat: 5.31, lng: 103.13 },
  { city: "Sandakan", country: "Malaysia", countryCode: "MY", lat: 5.84, lng: 118.12 },
  { city: "Melaka River", country: "Malaysia", countryCode: "MY", lat: 2.2, lng: 102.25 },

  // ── PHILIPPINES ──
  { city: "Siquijor", country: "Philippines", countryCode: "PH", lat: 9.21, lng: 123.51 },
  { city: "Apo Island", country: "Philippines", countryCode: "PH", lat: 9.07, lng: 123.27 },
  { city: "Malapascua", country: "Philippines", countryCode: "PH", lat: 11.33, lng: 124.11 },
  { city: "Sagada", country: "Philippines", countryCode: "PH", lat: 17.08, lng: 121.0 },
  { city: "Camiguin", country: "Philippines", countryCode: "PH", lat: 9.17, lng: 124.72 },
  { city: "Bantayan Island", country: "Philippines", countryCode: "PH", lat: 11.17, lng: 123.73 },
  { city: "Puerto Princesa", country: "Philippines", countryCode: "PH", lat: 9.74, lng: 118.74 },
  { city: "Zamboanga", country: "Philippines", countryCode: "PH", lat: 6.91, lng: 122.07 },
  { city: "Legazpi", country: "Philippines", countryCode: "PH", lat: 13.14, lng: 123.73 },
  { city: "Donsol", country: "Philippines", countryCode: "PH", lat: 12.91, lng: 123.59 },

  // ── CAMBODIA & LAOS ──
  { city: "Koh Tonsay", country: "Cambodia", countryCode: "KH", lat: 10.55, lng: 104.17 },
  { city: "Banlung", country: "Cambodia", countryCode: "KH", lat: 13.74, lng: 106.99 },
  { city: "Kratie", country: "Cambodia", countryCode: "KH", lat: 12.49, lng: 106.02 },
  { city: "Nong Khiaw", country: "Laos", countryCode: "LA", lat: 20.57, lng: 102.61 },
  { city: "Thakhek", country: "Laos", countryCode: "LA", lat: 17.39, lng: 104.8 },
  { city: "Phonsavan", country: "Laos", countryCode: "LA", lat: 19.45, lng: 103.18 },

  // ── MYANMAR ──
  { city: "Mrauk U", country: "Myanmar", countryCode: "MM", lat: 20.6, lng: 93.19 },
  { city: "Hsipaw", country: "Myanmar", countryCode: "MM", lat: 22.62, lng: 97.3 },
  { city: "Pyin Oo Lwin", country: "Myanmar", countryCode: "MM", lat: 22.04, lng: 96.47 },
  { city: "Hpa-An", country: "Myanmar", countryCode: "MM", lat: 16.89, lng: 97.63 },

  // ── INDIA ──
  { city: "Bikaner", country: "India", countryCode: "IN", lat: 28.02, lng: 73.31 },
  { city: "Orchha", country: "India", countryCode: "IN", lat: 25.35, lng: 78.64 },
  { city: "Visakhapatnam", country: "India", countryCode: "IN", lat: 17.69, lng: 83.22 },
  { city: "Coorg", country: "India", countryCode: "IN", lat: 12.34, lng: 75.81 },
  { city: "Thiruvananthapuram", country: "India", countryCode: "IN", lat: 8.52, lng: 76.94 },
  { city: "Andaman Islands", country: "India", countryCode: "IN", lat: 11.62, lng: 92.73 },
  { city: "Lakshadweep", country: "India", countryCode: "IN", lat: 10.57, lng: 72.64 },
  { city: "Mahabalipuram", country: "India", countryCode: "IN", lat: 12.62, lng: 80.19 },
  { city: "Varkala", country: "India", countryCode: "IN", lat: 8.73, lng: 76.72 },
  { city: "Nainital", country: "India", countryCode: "IN", lat: 29.38, lng: 79.45 },
  { city: "Mussoorie", country: "India", countryCode: "IN", lat: 30.45, lng: 78.07 },
  { city: "Kodaikanal", country: "India", countryCode: "IN", lat: 10.24, lng: 77.49 },
  { city: "Ajanta", country: "India", countryCode: "IN", lat: 20.55, lng: 75.7 },
  { city: "Ellora", country: "India", countryCode: "IN", lat: 20.03, lng: 75.18 },
  { city: "Bhopal", country: "India", countryCode: "IN", lat: 23.26, lng: 77.41 },
  { city: "Rann of Kutch", country: "India", countryCode: "IN", lat: 23.73, lng: 69.86 },
  { city: "Gokarna", country: "India", countryCode: "IN", lat: 14.55, lng: 74.32 },
  { city: "Wayanad", country: "India", countryCode: "IN", lat: 11.69, lng: 76.08 },
  { city: "Spiti Valley", country: "India", countryCode: "IN", lat: 32.5, lng: 78.03 },
  { city: "Tawang", country: "India", countryCode: "IN", lat: 27.59, lng: 91.86 },
  { city: "Diu", country: "India", countryCode: "IN", lat: 20.71, lng: 70.99 },
  { city: "Daman", country: "India", countryCode: "IN", lat: 20.41, lng: 72.85 },
  { city: "Chandigarh", country: "India", countryCode: "IN", lat: 30.73, lng: 76.78 },
  { city: "Lucknow", country: "India", countryCode: "IN", lat: 26.85, lng: 80.95 },
  { city: "Ujjain", country: "India", countryCode: "IN", lat: 23.18, lng: 75.78 },

  // ── NEPAL & BHUTAN ──
  { city: "Bandipur", country: "Nepal", countryCode: "NP", lat: 27.93, lng: 84.41 },
  { city: "Janakpur", country: "Nepal", countryCode: "NP", lat: 26.73, lng: 85.93 },
  { city: "Patan", country: "Nepal", countryCode: "NP", lat: 27.67, lng: 85.32 },
  { city: "Namche Bazaar", country: "Nepal", countryCode: "NP", lat: 27.81, lng: 86.71 },
  { city: "Bumthang", country: "Bhutan", countryCode: "BT", lat: 27.55, lng: 90.73 },
  { city: "Haa Valley", country: "Bhutan", countryCode: "BT", lat: 27.37, lng: 89.28 },

  // ── SRI LANKA ──
  { city: "Anuradhapura", country: "Sri Lanka", countryCode: "LK", lat: 8.31, lng: 80.41 },
  { city: "Polonnaruwa", country: "Sri Lanka", countryCode: "LK", lat: 7.94, lng: 81.0 },
  { city: "Bentota", country: "Sri Lanka", countryCode: "LK", lat: 6.43, lng: 79.99 },
  { city: "Tangalle", country: "Sri Lanka", countryCode: "LK", lat: 6.02, lng: 80.79 },
  { city: "Arugam Bay", country: "Sri Lanka", countryCode: "LK", lat: 6.84, lng: 81.84 },
  { city: "Unawatuna", country: "Sri Lanka", countryCode: "LK", lat: 6.01, lng: 80.25 },
  { city: "Hikkaduwa", country: "Sri Lanka", countryCode: "LK", lat: 6.14, lng: 80.1 },

  // ── BANGLADESH & PAKISTAN ──
  { city: "Chittagong", country: "Bangladesh", countryCode: "BD", lat: 22.36, lng: 91.78 },
  { city: "Srimangal", country: "Bangladesh", countryCode: "BD", lat: 24.31, lng: 91.73 },
  { city: "Sundarbans", country: "Bangladesh", countryCode: "BD", lat: 21.95, lng: 89.18 },
  { city: "Peshawar", country: "Pakistan", countryCode: "PK", lat: 34.01, lng: 71.58 },
  { city: "Gilgit", country: "Pakistan", countryCode: "PK", lat: 35.92, lng: 74.31 },
  { city: "Skardu", country: "Pakistan", countryCode: "PK", lat: 35.3, lng: 75.62 },
  { city: "Multan", country: "Pakistan", countryCode: "PK", lat: 30.2, lng: 71.45 },
  { city: "Taxila", country: "Pakistan", countryCode: "PK", lat: 33.75, lng: 72.8 },

  // ── CENTRAL ASIA ──
  { city: "Osh", country: "Kyrgyzstan", countryCode: "KG", lat: 40.53, lng: 72.8 },
  { city: "Arslanbob", country: "Kyrgyzstan", countryCode: "KG", lat: 41.33, lng: 72.94 },
  { city: "Song Kul", country: "Kyrgyzstan", countryCode: "KG", lat: 41.83, lng: 75.15 },
  { city: "Nukus", country: "Uzbekistan", countryCode: "UZ", lat: 42.46, lng: 59.6 },
  { city: "Shahrisabz", country: "Uzbekistan", countryCode: "UZ", lat: 39.06, lng: 66.83 },
  { city: "Khujand", country: "Tajikistan", countryCode: "TJ", lat: 40.28, lng: 69.62 },
  { city: "Pamir Highway", country: "Tajikistan", countryCode: "TJ", lat: 38.57, lng: 72.05 },
  { city: "Turkestan", country: "Kazakhstan", countryCode: "KZ", lat: 43.3, lng: 68.25 },
  { city: "Charyn Canyon", country: "Kazakhstan", countryCode: "KZ", lat: 43.35, lng: 79.08 },
  { city: "Mary", country: "Turkmenistan", countryCode: "TM", lat: 37.6, lng: 61.83 },

  // ── FRANCE ──
  { city: "Mont Saint-Michel", country: "France", countryCode: "FR", lat: 48.64, lng: -1.51 },
  { city: "Gordes", country: "France", countryCode: "FR", lat: 43.91, lng: 5.2 },
  { city: "Eze", country: "France", countryCode: "FR", lat: 43.73, lng: 7.36 },
  { city: "Giverny", country: "France", countryCode: "FR", lat: 49.08, lng: 1.53 },
  { city: "Amboise", country: "France", countryCode: "FR", lat: 47.41, lng: 0.98 },
  { city: "Honfleur", country: "France", countryCode: "FR", lat: 49.42, lng: 0.23 },
  { city: "Bayeux", country: "France", countryCode: "FR", lat: 49.28, lng: -0.7 },
  { city: "Etretat", country: "France", countryCode: "FR", lat: 49.71, lng: 0.2 },
  { city: "Sarlat", country: "France", countryCode: "FR", lat: 44.89, lng: 1.22 },
  { city: "Rocamadour", country: "France", countryCode: "FR", lat: 44.8, lng: 1.62 },
  { city: "Chartres", country: "France", countryCode: "FR", lat: 48.45, lng: 1.48 },
  { city: "Reims", country: "France", countryCode: "FR", lat: 49.25, lng: 3.88 },
  { city: "Perpignan", country: "France", countryCode: "FR", lat: 42.7, lng: 2.9 },
  { city: "Ajaccio", country: "France", countryCode: "FR", lat: 41.93, lng: 8.74 },
  { city: "Bonifacio", country: "France", countryCode: "FR", lat: 41.39, lng: 9.16 },
  { city: "Pau", country: "France", countryCode: "FR", lat: 43.3, lng: -0.37 },
  { city: "Lourdes", country: "France", countryCode: "FR", lat: 43.1, lng: -0.05 },
  { city: "Grasse", country: "France", countryCode: "FR", lat: 43.66, lng: 6.92 },

  // ── SPAIN ──
  { city: "Cuenca", country: "Spain", countryCode: "ES", lat: 40.07, lng: -2.13 },
  { city: "Nerja", country: "Spain", countryCode: "ES", lat: 36.75, lng: -3.88 },
  { city: "Tarifa", country: "Spain", countryCode: "ES", lat: 36.01, lng: -5.6 },
  { city: "Sitges", country: "Spain", countryCode: "ES", lat: 41.24, lng: 1.81 },
  { city: "Montserrat", country: "Spain", countryCode: "ES", lat: 41.59, lng: 1.84 },
  { city: "Formentera", country: "Spain", countryCode: "ES", lat: 38.7, lng: 1.44 },
  { city: "La Palma", country: "Spain", countryCode: "ES", lat: 28.68, lng: -17.76 },
  { city: "Almunecar", country: "Spain", countryCode: "ES", lat: 36.73, lng: -3.69 },
  { city: "Peniscola", country: "Spain", countryCode: "ES", lat: 40.36, lng: 0.41 },
  { city: "Burgos", country: "Spain", countryCode: "ES", lat: 42.34, lng: -3.7 },
  { city: "Leon", country: "Spain", countryCode: "ES", lat: 42.6, lng: -5.57 },
  { city: "Oviedo", country: "Spain", countryCode: "ES", lat: 43.36, lng: -5.85 },
  { city: "Avila", country: "Spain", countryCode: "ES", lat: 40.66, lng: -4.7 },
  { city: "Merida", country: "Spain", countryCode: "ES", lat: 38.92, lng: -6.34 },
  { city: "Caceres", country: "Spain", countryCode: "ES", lat: 39.47, lng: -6.37 },
  { city: "El Hierro", country: "Spain", countryCode: "ES", lat: 27.75, lng: -18.01 },

  // ── ITALY ──
  { city: "Assisi", country: "Italy", countryCode: "IT", lat: 43.07, lng: 12.62 },
  { city: "Alberobello", country: "Italy", countryCode: "IT", lat: 40.78, lng: 17.24 },
  { city: "Polignano a Mare", country: "Italy", countryCode: "IT", lat: 40.99, lng: 17.22 },
  { city: "Tropea", country: "Italy", countryCode: "IT", lat: 38.68, lng: 15.9 },
  { city: "Cefalu", country: "Italy", countryCode: "IT", lat: 38.04, lng: 14.02 },
  { city: "Agrigento", country: "Italy", countryCode: "IT", lat: 37.31, lng: 13.58 },
  { city: "Modica", country: "Italy", countryCode: "IT", lat: 36.86, lng: 14.76 },
  { city: "Ragusa", country: "Italy", countryCode: "IT", lat: 36.93, lng: 14.73 },
  { city: "Ostuni", country: "Italy", countryCode: "IT", lat: 40.73, lng: 17.58 },
  { city: "Trani", country: "Italy", countryCode: "IT", lat: 41.28, lng: 16.42 },
  { city: "Mantua", country: "Italy", countryCode: "IT", lat: 45.16, lng: 10.79 },
  { city: "Ferrara", country: "Italy", countryCode: "IT", lat: 44.84, lng: 11.62 },
  { city: "Urbino", country: "Italy", countryCode: "IT", lat: 43.73, lng: 12.64 },
  { city: "Cortona", country: "Italy", countryCode: "IT", lat: 43.28, lng: 11.99 },
  { city: "Monterosso", country: "Italy", countryCode: "IT", lat: 44.15, lng: 9.65 },
  { city: "Ischia", country: "Italy", countryCode: "IT", lat: 40.73, lng: 13.9 },
  { city: "Procida", country: "Italy", countryCode: "IT", lat: 40.76, lng: 14.01 },
  { city: "Savona", country: "Italy", countryCode: "IT", lat: 44.31, lng: 8.48 },
  { city: "Portofino", country: "Italy", countryCode: "IT", lat: 44.3, lng: 9.21 },
  { city: "Santa Margherita Ligure", country: "Italy", countryCode: "IT", lat: 44.33, lng: 9.21 },
  { city: "Bellagio", country: "Italy", countryCode: "IT", lat: 45.99, lng: 9.26 },
  { city: "Stresa", country: "Italy", countryCode: "IT", lat: 45.88, lng: 8.53 },
  { city: "Ortigia", country: "Italy", countryCode: "IT", lat: 37.06, lng: 15.29 },

  // ── UNITED KINGDOM ──
  { city: "Windermere", country: "United Kingdom", countryCode: "GB", lat: 54.38, lng: -2.91 },
  { city: "Whitby", country: "United Kingdom", countryCode: "GB", lat: 54.49, lng: -0.62 },
  { city: "St Ives", country: "United Kingdom", countryCode: "GB", lat: 50.21, lng: -5.48 },
  { city: "Fort William", country: "United Kingdom", countryCode: "GB", lat: 56.82, lng: -5.11 },
  { city: "Portree", country: "United Kingdom", countryCode: "GB", lat: 57.41, lng: -6.2 },
  { city: "Oban", country: "United Kingdom", countryCode: "GB", lat: 56.41, lng: -5.47 },
  { city: "Bournemouth", country: "United Kingdom", countryCode: "GB", lat: 50.72, lng: -1.88 },
  { city: "Chester", country: "United Kingdom", countryCode: "GB", lat: 53.19, lng: -2.89 },
  { city: "Exeter", country: "United Kingdom", countryCode: "GB", lat: 50.72, lng: -3.53 },
  { city: "Norwich", country: "United Kingdom", countryCode: "GB", lat: 52.63, lng: 1.3 },
  { city: "Stirling", country: "United Kingdom", countryCode: "GB", lat: 56.12, lng: -3.94 },
  { city: "Aberystwyth", country: "United Kingdom", countryCode: "GB", lat: 52.42, lng: -4.08 },
  { city: "Llandudno", country: "United Kingdom", countryCode: "GB", lat: 53.32, lng: -3.83 },
  { city: "Derry", country: "United Kingdom", countryCode: "GB", lat: 54.99, lng: -7.32 },
  {
    city: "Giant's Causeway",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 55.24,
    lng: -6.51,
  },
  {
    city: "Shetland Islands",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 60.39,
    lng: -1.17,
  },
  { city: "Isle of Wight", country: "United Kingdom", countryCode: "GB", lat: 50.69, lng: -1.3 },
  { city: "Guernsey", country: "United Kingdom", countryCode: "GG", lat: 49.45, lng: -2.54 },

  // ── GERMANY ──
  { city: "Berchtesgaden", country: "Germany", countryCode: "DE", lat: 47.63, lng: 13.0 },
  { city: "Rugen Island", country: "Germany", countryCode: "DE", lat: 54.43, lng: 13.43 },
  { city: "Sylt", country: "Germany", countryCode: "DE", lat: 54.91, lng: 8.33 },
  { city: "Wurzburg", country: "Germany", countryCode: "DE", lat: 49.79, lng: 9.95 },
  { city: "Passau", country: "Germany", countryCode: "DE", lat: 48.57, lng: 13.46 },
  { city: "Konstanz", country: "Germany", countryCode: "DE", lat: 47.66, lng: 9.18 },
  { city: "Cochem", country: "Germany", countryCode: "DE", lat: 50.15, lng: 7.17 },
  { city: "Quedlinburg", country: "Germany", countryCode: "DE", lat: 51.79, lng: 11.15 },
  { city: "Schwerin", country: "Germany", countryCode: "DE", lat: 53.63, lng: 11.41 },
  { city: "Rostock", country: "Germany", countryCode: "DE", lat: 54.09, lng: 12.1 },
  { city: "Erfurt", country: "Germany", countryCode: "DE", lat: 50.98, lng: 11.03 },
  { city: "Aachen", country: "Germany", countryCode: "DE", lat: 50.78, lng: 6.08 },
  { city: "Lindau", country: "Germany", countryCode: "DE", lat: 47.55, lng: 9.68 },
  { city: "Mittenwald", country: "Germany", countryCode: "DE", lat: 47.44, lng: 11.26 },

  // ── NETHERLANDS ──
  { city: "Eindhoven", country: "Netherlands", countryCode: "NL", lat: 51.44, lng: 5.47 },
  { city: "Giethoorn", country: "Netherlands", countryCode: "NL", lat: 52.72, lng: 6.08 },
  { city: "Zaanse Schans", country: "Netherlands", countryCode: "NL", lat: 52.47, lng: 4.77 },
  { city: "Texel", country: "Netherlands", countryCode: "NL", lat: 53.08, lng: 4.8 },
  { city: "Kinderdijk", country: "Netherlands", countryCode: "NL", lat: 51.88, lng: 4.64 },
  { city: "Den Bosch", country: "Netherlands", countryCode: "NL", lat: 51.69, lng: 5.3 },

  // ── AUSTRIA ──
  { city: "Wachau Valley", country: "Austria", countryCode: "AT", lat: 48.37, lng: 15.42 },
  { city: "Klagenfurt", country: "Austria", countryCode: "AT", lat: 46.62, lng: 14.31 },
  { city: "Bregenz", country: "Austria", countryCode: "AT", lat: 47.5, lng: 9.75 },
  { city: "Kitzbuhel", country: "Austria", countryCode: "AT", lat: 47.45, lng: 12.39 },
  { city: "Villach", country: "Austria", countryCode: "AT", lat: 46.61, lng: 13.85 },

  // ── SWITZERLAND ──
  { city: "Wengen", country: "Switzerland", countryCode: "CH", lat: 46.61, lng: 7.92 },
  { city: "Murren", country: "Switzerland", countryCode: "CH", lat: 46.56, lng: 7.89 },
  { city: "Jungfraujoch", country: "Switzerland", countryCode: "CH", lat: 46.55, lng: 7.96 },
  { city: "Lauterbrunnen", country: "Switzerland", countryCode: "CH", lat: 46.59, lng: 7.91 },
  { city: "Brig", country: "Switzerland", countryCode: "CH", lat: 46.31, lng: 7.99 },
  { city: "Locarno", country: "Switzerland", countryCode: "CH", lat: 46.17, lng: 8.8 },
  { city: "Ascona", country: "Switzerland", countryCode: "CH", lat: 46.16, lng: 8.77 },
  { city: "Appenzell", country: "Switzerland", countryCode: "CH", lat: 47.33, lng: 9.41 },
  { city: "Thun", country: "Switzerland", countryCode: "CH", lat: 46.76, lng: 7.63 },
  { city: "Sion", country: "Switzerland", countryCode: "CH", lat: 46.23, lng: 7.36 },

  // ── PORTUGAL ──
  { city: "Obidos", country: "Portugal", countryCode: "PT", lat: 39.36, lng: -9.16 },
  { city: "Aveiro", country: "Portugal", countryCode: "PT", lat: 40.64, lng: -8.65 },
  { city: "Monsanto", country: "Portugal", countryCode: "PT", lat: 40.04, lng: -7.12 },
  { city: "Douro Valley", country: "Portugal", countryCode: "PT", lat: 41.16, lng: -7.79 },
  { city: "Peneda-Geres", country: "Portugal", countryCode: "PT", lat: 41.73, lng: -8.15 },
  { city: "Tomar", country: "Portugal", countryCode: "PT", lat: 39.6, lng: -8.42 },

  // ── SCANDINAVIA ──
  { city: "Bodo", country: "Norway", countryCode: "NO", lat: 67.28, lng: 14.4 },
  { city: "Hammerfest", country: "Norway", countryCode: "NO", lat: 70.66, lng: 23.68 },
  { city: "Kristiansand", country: "Norway", countryCode: "NO", lat: 58.15, lng: 8.0 },
  { city: "Narvik", country: "Norway", countryCode: "NO", lat: 68.44, lng: 17.43 },
  { city: "Roros", country: "Norway", countryCode: "NO", lat: 62.57, lng: 11.38 },
  { city: "Lillehammer", country: "Norway", countryCode: "NO", lat: 61.12, lng: 10.47 },
  { city: "Helsingborg", country: "Sweden", countryCode: "SE", lat: 56.04, lng: 12.69 },
  { city: "Linkoping", country: "Sweden", countryCode: "SE", lat: 58.41, lng: 15.63 },
  { city: "Kalmar", country: "Sweden", countryCode: "SE", lat: 56.66, lng: 16.36 },
  { city: "Lund", country: "Sweden", countryCode: "SE", lat: 55.7, lng: 13.19 },
  { city: "Oland", country: "Sweden", countryCode: "SE", lat: 56.73, lng: 16.63 },
  { city: "Aalborg", country: "Denmark", countryCode: "DK", lat: 57.05, lng: 9.92 },
  { city: "Roskilde", country: "Denmark", countryCode: "DK", lat: 55.64, lng: 12.09 },
  { city: "Skagen", country: "Denmark", countryCode: "DK", lat: 57.72, lng: 10.59 },
  { city: "Bornholm", country: "Denmark", countryCode: "DK", lat: 55.13, lng: 14.92 },
  { city: "Savonlinna", country: "Finland", countryCode: "FI", lat: 61.87, lng: 28.88 },
  { city: "Inari", country: "Finland", countryCode: "FI", lat: 69.07, lng: 27.03 },
  { city: "Levi", country: "Finland", countryCode: "FI", lat: 67.8, lng: 24.81 },
  { city: "Porvoo", country: "Finland", countryCode: "FI", lat: 60.39, lng: 25.66 },
  { city: "Westfjords", country: "Iceland", countryCode: "IS", lat: 65.75, lng: -22.07 },
  { city: "Myvatn", country: "Iceland", countryCode: "IS", lat: 65.6, lng: -16.99 },
  { city: "Jokulsarlon", country: "Iceland", countryCode: "IS", lat: 64.05, lng: -16.18 },
  { city: "Seyoisfjorour", country: "Iceland", countryCode: "IS", lat: 65.26, lng: -14.01 },
  { city: "Landmannalaugar", country: "Iceland", countryCode: "IS", lat: 63.99, lng: -19.06 },

  // ── CENTRAL & EASTERN EUROPE ──
  { city: "Plzen", country: "Czech Republic", countryCode: "CZ", lat: 49.75, lng: 13.38 },
  { city: "Telc", country: "Czech Republic", countryCode: "CZ", lat: 49.18, lng: 15.45 },
  { city: "Litomysl", country: "Czech Republic", countryCode: "CZ", lat: 49.87, lng: 16.31 },
  { city: "Szentendre", country: "Hungary", countryCode: "HU", lat: 47.67, lng: 19.07 },
  { city: "Heviz", country: "Hungary", countryCode: "HU", lat: 46.79, lng: 17.19 },
  { city: "Sopron", country: "Hungary", countryCode: "HU", lat: 47.68, lng: 16.59 },
  { city: "Bialystok", country: "Poland", countryCode: "PL", lat: 53.13, lng: 23.16 },
  { city: "Malbork", country: "Poland", countryCode: "PL", lat: 54.04, lng: 19.03 },
  { city: "Sopot", country: "Poland", countryCode: "PL", lat: 54.44, lng: 18.57 },
  { city: "Wieliczka", country: "Poland", countryCode: "PL", lat: 49.99, lng: 20.06 },
  { city: "Bran", country: "Romania", countryCode: "RO", lat: 45.52, lng: 25.37 },
  { city: "Oradea", country: "Romania", countryCode: "RO", lat: 47.07, lng: 21.92 },
  { city: "Iasi", country: "Romania", countryCode: "RO", lat: 47.17, lng: 27.57 },
  { city: "Bansko", country: "Bulgaria", countryCode: "BG", lat: 41.84, lng: 23.49 },
  { city: "Nessebar", country: "Bulgaria", countryCode: "BG", lat: 42.66, lng: 27.73 },
  { city: "Sozopol", country: "Bulgaria", countryCode: "BG", lat: 42.42, lng: 27.7 },
  { city: "Subotica", country: "Serbia", countryCode: "RS", lat: 46.1, lng: 19.67 },
  { city: "Zlatibor", country: "Serbia", countryCode: "RS", lat: 43.73, lng: 19.7 },
  { city: "Bohinj", country: "Slovenia", countryCode: "SI", lat: 46.28, lng: 13.86 },
  { city: "Postojna", country: "Slovenia", countryCode: "SI", lat: 45.78, lng: 14.21 },

  // ── GREECE ──
  { city: "Folegandros", country: "Greece", countryCode: "GR", lat: 36.62, lng: 24.91 },
  { city: "Syros", country: "Greece", countryCode: "GR", lat: 37.44, lng: 24.94 },
  { city: "Tinos", country: "Greece", countryCode: "GR", lat: 37.54, lng: 25.16 },
  { city: "Skiathos", country: "Greece", countryCode: "GR", lat: 39.16, lng: 23.49 },
  { city: "Skopelos", country: "Greece", countryCode: "GR", lat: 39.12, lng: 23.73 },
  { city: "Alonissos", country: "Greece", countryCode: "GR", lat: 39.15, lng: 23.87 },
  { city: "Paxos", country: "Greece", countryCode: "GR", lat: 39.2, lng: 20.17 },
  { city: "Ithaca", country: "Greece", countryCode: "GR", lat: 38.37, lng: 20.72 },
  { city: "Olympia", country: "Greece", countryCode: "GR", lat: 37.64, lng: 21.63 },
  { city: "Monemvasia", country: "Greece", countryCode: "GR", lat: 36.69, lng: 23.06 },
  { city: "Pelion", country: "Greece", countryCode: "GR", lat: 39.39, lng: 23.05 },
  { city: "Samothrace", country: "Greece", countryCode: "GR", lat: 40.47, lng: 25.52 },
  { city: "Karpathos", country: "Greece", countryCode: "GR", lat: 35.51, lng: 27.12 },
  { city: "Ikaria", country: "Greece", countryCode: "GR", lat: 37.6, lng: 26.16 },
  { city: "Kalamata", country: "Greece", countryCode: "GR", lat: 37.04, lng: 22.11 },

  // ── CROATIA ──
  { city: "Mljet", country: "Croatia", countryCode: "HR", lat: 42.73, lng: 17.38 },
  { city: "Ston", country: "Croatia", countryCode: "HR", lat: 42.84, lng: 17.69 },
  { city: "Motovun", country: "Croatia", countryCode: "HR", lat: 45.34, lng: 13.83 },
  { city: "Krka National Park", country: "Croatia", countryCode: "HR", lat: 43.8, lng: 15.96 },
  { city: "Nin", country: "Croatia", countryCode: "HR", lat: 44.24, lng: 15.18 },
  { city: "Opatija", country: "Croatia", countryCode: "HR", lat: 45.34, lng: 14.31 },
  { city: "Makarska", country: "Croatia", countryCode: "HR", lat: 43.3, lng: 17.02 },
  { city: "Rab", country: "Croatia", countryCode: "HR", lat: 44.76, lng: 14.76 },
  { city: "Cres", country: "Croatia", countryCode: "HR", lat: 44.96, lng: 14.4 },

  // ── TURKEY ──
  { city: "Mardin", country: "Turkey", countryCode: "TR", lat: 37.31, lng: 40.74 },
  { city: "Safranbolu", country: "Turkey", countryCode: "TR", lat: 41.25, lng: 32.69 },
  { city: "Amasya", country: "Turkey", countryCode: "TR", lat: 40.65, lng: 35.83 },
  { city: "Ani", country: "Turkey", countryCode: "TR", lat: 40.51, lng: 43.57 },
  { city: "Sumela Monastery", country: "Turkey", countryCode: "TR", lat: 40.69, lng: 39.66 },
  { city: "Goreme", country: "Turkey", countryCode: "TR", lat: 38.64, lng: 34.83 },
  { city: "Datca", country: "Turkey", countryCode: "TR", lat: 36.73, lng: 27.69 },
  { city: "Butterfly Valley", country: "Turkey", countryCode: "TR", lat: 36.53, lng: 29.1 },
  { city: "Olimpos", country: "Turkey", countryCode: "TR", lat: 36.4, lng: 30.47 },
  { city: "Ayvalik", country: "Turkey", countryCode: "TR", lat: 39.31, lng: 26.69 },
  { city: "Bozcaada", country: "Turkey", countryCode: "TR", lat: 39.84, lng: 25.98 },
  { city: "Sanliurfa", country: "Turkey", countryCode: "TR", lat: 37.17, lng: 38.79 },
  { city: "Nemrut Dagi", country: "Turkey", countryCode: "TR", lat: 37.98, lng: 38.74 },
  { city: "Van", country: "Turkey", countryCode: "TR", lat: 38.49, lng: 43.38 },

  // ── MIDDLE EAST ──
  { city: "Fujairah", country: "United Arab Emirates", countryCode: "AE", lat: 25.13, lng: 56.33 },
  { city: "Acre", country: "Israel", countryCode: "IL", lat: 32.93, lng: 35.08 },
  { city: "Safed", country: "Israel", countryCode: "IL", lat: 32.97, lng: 35.5 },
  { city: "Nazareth", country: "Israel", countryCode: "IL", lat: 32.7, lng: 35.3 },
  { city: "Madaba", country: "Jordan", countryCode: "JO", lat: 31.72, lng: 35.79 },
  { city: "Dana", country: "Jordan", countryCode: "JO", lat: 30.66, lng: 35.62 },
  { city: "Neom", country: "Saudi Arabia", countryCode: "SA", lat: 28.0, lng: 35.0 },
  { city: "Abha", country: "Saudi Arabia", countryCode: "SA", lat: 18.22, lng: 42.5 },
  { city: "Tabuk", country: "Saudi Arabia", countryCode: "SA", lat: 28.38, lng: 36.57 },
  { city: "Byblos", country: "Lebanon", countryCode: "LB", lat: 34.12, lng: 35.65 },
  { city: "Sidon", country: "Lebanon", countryCode: "LB", lat: 33.56, lng: 35.37 },
  { city: "Wahiba Sands", country: "Oman", countryCode: "OM", lat: 22.06, lng: 58.47 },
  { city: "Jebel Akhdar", country: "Oman", countryCode: "OM", lat: 23.21, lng: 57.28 },
  { city: "Sohar", country: "Oman", countryCode: "OM", lat: 24.36, lng: 56.73 },

  // ── NORTH AFRICA ──
  { city: "Ifrane", country: "Morocco", countryCode: "MA", lat: 33.53, lng: -5.11 },
  { city: "Asilah", country: "Morocco", countryCode: "MA", lat: 35.47, lng: -6.03 },
  { city: "Ait Benhaddou", country: "Morocco", countryCode: "MA", lat: 31.05, lng: -7.13 },
  { city: "Dades Valley", country: "Morocco", countryCode: "MA", lat: 31.42, lng: -5.96 },
  { city: "Todra Gorge", country: "Morocco", countryCode: "MA", lat: 31.59, lng: -5.59 },
  { city: "Moulay Idriss", country: "Morocco", countryCode: "MA", lat: 34.06, lng: -5.52 },
  { city: "El Jadida", country: "Morocco", countryCode: "MA", lat: 33.26, lng: -8.5 },
  { city: "Abu Simbel", country: "Egypt", countryCode: "EG", lat: 22.34, lng: 31.63 },
  { city: "El Gouna", country: "Egypt", countryCode: "EG", lat: 27.18, lng: 33.68 },
  { city: "White Desert", country: "Egypt", countryCode: "EG", lat: 28.2, lng: 28.03 },
  { city: "Kairouan", country: "Tunisia", countryCode: "TN", lat: 35.68, lng: 10.1 },
  { city: "Tozeur", country: "Tunisia", countryCode: "TN", lat: 33.92, lng: 8.13 },
  { city: "Matmata", country: "Tunisia", countryCode: "TN", lat: 33.54, lng: 9.97 },
  { city: "Ghardaia", country: "Algeria", countryCode: "DZ", lat: 32.49, lng: 3.67 },
  { city: "Constantine", country: "Algeria", countryCode: "DZ", lat: 36.37, lng: 6.61 },
  { city: "Tlemcen", country: "Algeria", countryCode: "DZ", lat: 34.88, lng: -1.31 },

  // ── EAST AFRICA ──
  { city: "Watamu", country: "Kenya", countryCode: "KE", lat: -3.35, lng: 40.02 },
  { city: "Malindi", country: "Kenya", countryCode: "KE", lat: -3.22, lng: 40.12 },
  { city: "Tsavo", country: "Kenya", countryCode: "KE", lat: -2.99, lng: 38.47 },
  { city: "Samburu", country: "Kenya", countryCode: "KE", lat: 0.52, lng: 37.53 },
  { city: "Lake Nakuru", country: "Kenya", countryCode: "KE", lat: -0.37, lng: 36.09 },
  { city: "Moshi", country: "Tanzania", countryCode: "TZ", lat: -3.34, lng: 37.34 },
  { city: "Mafia Island", country: "Tanzania", countryCode: "TZ", lat: -7.85, lng: 39.78 },
  { city: "Lake Manyara", country: "Tanzania", countryCode: "TZ", lat: -3.53, lng: 35.82 },
  { city: "Musanze", country: "Rwanda", countryCode: "RW", lat: -1.5, lng: 29.63 },
  { city: "Nyungwe Forest", country: "Rwanda", countryCode: "RW", lat: -2.45, lng: 29.22 },
  { city: "Queen Elizabeth NP", country: "Uganda", countryCode: "UG", lat: -0.2, lng: 30.0 },
  { city: "Bahir Dar", country: "Ethiopia", countryCode: "ET", lat: 11.59, lng: 37.39 },
  { city: "Simien Mountains", country: "Ethiopia", countryCode: "ET", lat: 13.22, lng: 38.07 },

  // ── SOUTHERN AFRICA ──
  { city: "Pilanesburg", country: "South Africa", countryCode: "ZA", lat: -25.28, lng: 27.09 },
  { city: "Drakensberg", country: "South Africa", countryCode: "ZA", lat: -28.74, lng: 29.22 },
  { city: "Hluhluwe", country: "South Africa", countryCode: "ZA", lat: -28.03, lng: 32.27 },
  {
    city: "Addo Elephant Park",
    country: "South Africa",
    countryCode: "ZA",
    lat: -33.44,
    lng: 25.77,
  },
  { city: "Plettenberg Bay", country: "South Africa", countryCode: "ZA", lat: -34.05, lng: 23.37 },
  { city: "Simon's Town", country: "South Africa", countryCode: "ZA", lat: -34.19, lng: 18.43 },
  { city: "Skeleton Coast", country: "Namibia", countryCode: "NA", lat: -20.6, lng: 13.5 },
  { city: "Walvis Bay", country: "Namibia", countryCode: "NA", lat: -22.96, lng: 14.51 },
  { city: "Damaraland", country: "Namibia", countryCode: "NA", lat: -20.4, lng: 14.5 },
  { city: "Kasane", country: "Botswana", countryCode: "BW", lat: -17.8, lng: 25.15 },
  { city: "Makgadikgadi Pans", country: "Botswana", countryCode: "BW", lat: -20.5, lng: 25.5 },
  { city: "Lower Zambezi", country: "Zambia", countryCode: "ZM", lat: -15.35, lng: 29.23 },
  { city: "Vilankulo", country: "Mozambique", countryCode: "MZ", lat: -22.0, lng: 35.32 },
  { city: "Ile Sainte-Marie", country: "Madagascar", countryCode: "MG", lat: -17.0, lng: 49.85 },
  { city: "Morondava", country: "Madagascar", countryCode: "MG", lat: -20.28, lng: 44.28 },

  // ── WEST AFRICA ──
  { city: "Elmina", country: "Ghana", countryCode: "GH", lat: 5.08, lng: -1.35 },
  { city: "Mole National Park", country: "Ghana", countryCode: "GH", lat: 9.26, lng: -1.85 },
  { city: "Casamance", country: "Senegal", countryCode: "SN", lat: 12.55, lng: -16.27 },
  { city: "Djenne", country: "Mali", countryCode: "ML", lat: 13.91, lng: -4.56 },
  { city: "Timbuktu", country: "Mali", countryCode: "ML", lat: 16.77, lng: -3.01 },
  { city: "Ouidah", country: "Benin", countryCode: "BJ", lat: 6.37, lng: 2.09 },
  { city: "Ganvie", country: "Benin", countryCode: "BJ", lat: 6.47, lng: 2.42 },

  // ── UNITED STATES ──
  { city: "Bryce Canyon", country: "United States", countryCode: "US", lat: 37.59, lng: -112.19 },
  { city: "Acadia", country: "United States", countryCode: "US", lat: 44.35, lng: -68.21 },
  { city: "Joshua Tree", country: "United States", countryCode: "US", lat: 33.87, lng: -115.9 },
  { city: "Olympic", country: "United States", countryCode: "US", lat: 47.97, lng: -123.5 },
  { city: "Bend", country: "United States", countryCode: "US", lat: 44.06, lng: -121.31 },
  { city: "Whitefish", country: "United States", countryCode: "US", lat: 48.41, lng: -114.35 },
  { city: "Missoula", country: "United States", countryCode: "US", lat: 46.87, lng: -114.0 },
  { city: "Sun Valley", country: "United States", countryCode: "US", lat: 43.7, lng: -114.35 },
  { city: "Sedona", country: "United States", countryCode: "US", lat: 34.87, lng: -111.76 },
  { city: "Vail", country: "United States", countryCode: "US", lat: 39.64, lng: -106.37 },
  { city: "Stowe", country: "United States", countryCode: "US", lat: 44.47, lng: -72.69 },
  { city: "Block Island", country: "United States", countryCode: "US", lat: 41.17, lng: -71.58 },
  { city: "Mackinac Island", country: "United States", countryCode: "US", lat: 45.85, lng: -84.62 },
  { city: "Door County", country: "United States", countryCode: "US", lat: 45.05, lng: -87.14 },
  { city: "Traverse City", country: "United States", countryCode: "US", lat: 44.76, lng: -85.62 },
  { city: "Myrtle Beach", country: "United States", countryCode: "US", lat: 33.69, lng: -78.89 },
  { city: "Destin", country: "United States", countryCode: "US", lat: 30.39, lng: -86.5 },
  { city: "Gulf Shores", country: "United States", countryCode: "US", lat: 30.25, lng: -87.7 },
  { city: "St. Petersburg", country: "United States", countryCode: "US", lat: 27.77, lng: -82.64 },
  { city: "Naples", country: "United States", countryCode: "US", lat: 26.14, lng: -81.79 },
  { city: "Raleigh", country: "United States", countryCode: "US", lat: 35.78, lng: -78.64 },
  { city: "Richmond", country: "United States", countryCode: "US", lat: 37.54, lng: -77.44 },
  { city: "Indianapolis", country: "United States", countryCode: "US", lat: 39.77, lng: -86.16 },
  { city: "Kansas City", country: "United States", countryCode: "US", lat: 39.1, lng: -94.58 },
  { city: "Milwaukee", country: "United States", countryCode: "US", lat: 43.04, lng: -87.91 },
  { city: "Cleveland", country: "United States", countryCode: "US", lat: 41.5, lng: -81.69 },
  { city: "Columbus", country: "United States", countryCode: "US", lat: 39.96, lng: -83.0 },
  { city: "Leavenworth", country: "United States", countryCode: "US", lat: 47.6, lng: -120.66 },
  { city: "Lahaina", country: "United States", countryCode: "US", lat: 20.87, lng: -156.68 },
  { city: "Juneau", country: "United States", countryCode: "US", lat: 58.3, lng: -134.42 },
  { city: "Sitka", country: "United States", countryCode: "US", lat: 57.05, lng: -135.33 },
  { city: "Skagway", country: "United States", countryCode: "US", lat: 59.46, lng: -135.31 },
  { city: "Hilo", country: "United States", countryCode: "US", lat: 19.72, lng: -155.08 },
  { city: "Death Valley", country: "United States", countryCode: "US", lat: 36.46, lng: -116.87 },
  { city: "Big Sur", country: "United States", countryCode: "US", lat: 36.27, lng: -121.81 },
  { city: "Sonoma", country: "United States", countryCode: "US", lat: 38.29, lng: -122.46 },

  // ── CANADA ──
  { city: "Whitehorse", country: "Canada", countryCode: "CA", lat: 60.72, lng: -135.06 },
  { city: "Kamloops", country: "Canada", countryCode: "CA", lat: 50.67, lng: -120.33 },
  { city: "Nelson", country: "Canada", countryCode: "CA", lat: 49.49, lng: -117.29 },
  { city: "Canmore", country: "Canada", countryCode: "CA", lat: 51.09, lng: -115.36 },
  { city: "Thunder Bay", country: "Canada", countryCode: "CA", lat: 48.38, lng: -89.25 },
  { city: "Peggy's Cove", country: "Canada", countryCode: "CA", lat: 44.49, lng: -63.92 },
  { city: "Cabot Trail", country: "Canada", countryCode: "CA", lat: 46.73, lng: -60.85 },
  { city: "Gros Morne", country: "Canada", countryCode: "CA", lat: 49.6, lng: -57.78 },
  { city: "Fogo Island", country: "Canada", countryCode: "CA", lat: 49.72, lng: -54.17 },
  { city: "Trois-Rivieres", country: "Canada", countryCode: "CA", lat: 46.35, lng: -72.55 },
  { city: "Rimouski", country: "Canada", countryCode: "CA", lat: 48.45, lng: -68.52 },
  { city: "Tadoussac", country: "Canada", countryCode: "CA", lat: 48.15, lng: -69.72 },
  { city: "Golden", country: "Canada", countryCode: "CA", lat: 51.3, lng: -116.97 },
  { city: "Revelstoke", country: "Canada", countryCode: "CA", lat: 51.0, lng: -118.2 },
  { city: "Penticton", country: "Canada", countryCode: "CA", lat: 49.49, lng: -119.59 },
  { city: "Ucluelet", country: "Canada", countryCode: "CA", lat: 48.94, lng: -125.55 },
  { city: "Regina", country: "Canada", countryCode: "CA", lat: 50.45, lng: -104.62 },

  // ── MEXICO ──
  { city: "Valle de Bravo", country: "Mexico", countryCode: "MX", lat: 19.19, lng: -100.13 },
  { city: "Hierve el Agua", country: "Mexico", countryCode: "MX", lat: 16.87, lng: -96.28 },
  { city: "Celestun", country: "Mexico", countryCode: "MX", lat: 20.86, lng: -90.4 },
  { city: "Izamal", country: "Mexico", countryCode: "MX", lat: 20.93, lng: -89.02 },
  { city: "Chichen Itza", country: "Mexico", countryCode: "MX", lat: 20.68, lng: -88.57 },
  { city: "Xalapa", country: "Mexico", countryCode: "MX", lat: 19.54, lng: -96.93 },
  { city: "Tlacotalpan", country: "Mexico", countryCode: "MX", lat: 18.62, lng: -95.66 },
  { city: "Zacatecas", country: "Mexico", countryCode: "MX", lat: 22.77, lng: -102.58 },
  { city: "Real de Catorce", country: "Mexico", countryCode: "MX", lat: 23.69, lng: -100.89 },
  { city: "Durango", country: "Mexico", countryCode: "MX", lat: 24.02, lng: -104.67 },
  { city: "San Jose del Cabo", country: "Mexico", countryCode: "MX", lat: 23.06, lng: -109.7 },
  { city: "Teotihuacan", country: "Mexico", countryCode: "MX", lat: 19.69, lng: -98.84 },
  { city: "Uxmal", country: "Mexico", countryCode: "MX", lat: 20.36, lng: -89.77 },
  { city: "Ixtapa", country: "Mexico", countryCode: "MX", lat: 17.67, lng: -101.6 },
  { city: "Ensenada", country: "Mexico", countryCode: "MX", lat: 31.87, lng: -116.6 },

  // ── CENTRAL AMERICA ──
  { city: "Cahuita", country: "Costa Rica", countryCode: "CR", lat: 9.74, lng: -82.84 },
  { city: "Dominical", country: "Costa Rica", countryCode: "CR", lat: 9.25, lng: -83.86 },
  { city: "Nosara", country: "Costa Rica", countryCode: "CR", lat: 9.98, lng: -85.65 },
  { city: "Uvita", country: "Costa Rica", countryCode: "CR", lat: 9.16, lng: -83.74 },
  { city: "Corcovado", country: "Costa Rica", countryCode: "CR", lat: 8.55, lng: -83.55 },
  { city: "San Ignacio", country: "Belize", countryCode: "BZ", lat: 17.16, lng: -89.07 },
  { city: "Tikal", country: "Guatemala", countryCode: "GT", lat: 17.22, lng: -89.62 },
  { city: "Xela", country: "Guatemala", countryCode: "GT", lat: 14.83, lng: -91.52 },
  { city: "Livingston", country: "Guatemala", countryCode: "GT", lat: 15.83, lng: -88.75 },
  { city: "Rio Dulce", country: "Guatemala", countryCode: "GT", lat: 15.66, lng: -89.01 },
  { city: "El Zonte", country: "El Salvador", countryCode: "SV", lat: 13.5, lng: -89.39 },
  { city: "Suchitoto", country: "El Salvador", countryCode: "SV", lat: 13.94, lng: -89.03 },
  { city: "Little Corn Island", country: "Nicaragua", countryCode: "NI", lat: 12.15, lng: -82.98 },
  { city: "Corn Islands", country: "Nicaragua", countryCode: "NI", lat: 12.17, lng: -83.06 },
  { city: "David", country: "Panama", countryCode: "PA", lat: 8.43, lng: -82.43 },
  { city: "Boquete", country: "Panama", countryCode: "PA", lat: 8.78, lng: -82.44 },
  { city: "San Blas Islands", country: "Panama", countryCode: "PA", lat: 9.56, lng: -78.99 },
  { city: "Santa Catalina", country: "Panama", countryCode: "PA", lat: 7.63, lng: -81.24 },

  // ── CARIBBEAN ──
  { city: "Rincon", country: "Puerto Rico", countryCode: "PR", lat: 18.34, lng: -67.25 },
  { city: "Vieques", country: "Puerto Rico", countryCode: "PR", lat: 18.13, lng: -65.44 },
  { city: "Culebra", country: "Puerto Rico", countryCode: "PR", lat: 18.3, lng: -65.28 },
  { city: "Port Antonio", country: "Jamaica", countryCode: "JM", lat: 18.18, lng: -76.45 },
  { city: "Treasure Beach", country: "Jamaica", countryCode: "JM", lat: 17.88, lng: -77.74 },
  { city: "Eleuthera", country: "Bahamas", countryCode: "BS", lat: 25.13, lng: -76.14 },
  { city: "Andros", country: "Bahamas", countryCode: "BS", lat: 24.7, lng: -78.02 },
  {
    city: "Bequia",
    country: "Saint Vincent and the Grenadines",
    countryCode: "VC",
    lat: 13.01,
    lng: -61.23,
  },
  {
    city: "Mustique",
    country: "Saint Vincent and the Grenadines",
    countryCode: "VC",
    lat: 12.89,
    lng: -61.18,
  },
  { city: "Nevis", country: "Saint Kitts and Nevis", countryCode: "KN", lat: 17.15, lng: -62.58 },
  { city: "Montserrat", country: "Montserrat", countryCode: "MS", lat: 16.74, lng: -62.19 },
  { city: "Saba", country: "Netherlands", countryCode: "BQ", lat: 17.63, lng: -63.23 },
  { city: "Grand Turk", country: "Turks and Caicos", countryCode: "TC", lat: 21.46, lng: -71.14 },

  // ── COLOMBIA ──
  { city: "Jardin", country: "Colombia", countryCode: "CO", lat: 5.6, lng: -75.82 },
  { city: "Barichara", country: "Colombia", countryCode: "CO", lat: 6.64, lng: -73.23 },
  { city: "Popayan", country: "Colombia", countryCode: "CO", lat: 2.44, lng: -76.61 },
  { city: "Palomino", country: "Colombia", countryCode: "CO", lat: 11.25, lng: -73.57 },
  { city: "Rincon del Mar", country: "Colombia", countryCode: "CO", lat: 9.73, lng: -75.74 },
  { city: "San Gil", country: "Colombia", countryCode: "CO", lat: 6.56, lng: -73.13 },
  { city: "Tatacoa Desert", country: "Colombia", countryCode: "CO", lat: 3.23, lng: -75.17 },
  { city: "Nuqui", country: "Colombia", countryCode: "CO", lat: 5.71, lng: -77.27 },
  { city: "Manizales", country: "Colombia", countryCode: "CO", lat: 5.07, lng: -75.52 },
  { city: "Bucaramanga", country: "Colombia", countryCode: "CO", lat: 7.12, lng: -73.12 },

  // ── PERU ──
  { city: "Chachapoyas", country: "Peru", countryCode: "PE", lat: -6.23, lng: -77.87 },
  { city: "Mancora", country: "Peru", countryCode: "PE", lat: -4.1, lng: -81.05 },
  { city: "Ayacucho", country: "Peru", countryCode: "PE", lat: -13.16, lng: -74.22 },
  { city: "Ollantaytambo", country: "Peru", countryCode: "PE", lat: -13.26, lng: -72.26 },
  { city: "Pisac", country: "Peru", countryCode: "PE", lat: -13.42, lng: -71.85 },
  { city: "Paracas", country: "Peru", countryCode: "PE", lat: -13.84, lng: -76.25 },
  { city: "Cajamarca", country: "Peru", countryCode: "PE", lat: -7.16, lng: -78.51 },

  // ── ARGENTINA ──
  { city: "Tilcara", country: "Argentina", countryCode: "AR", lat: -23.58, lng: -65.4 },
  { city: "Iruya", country: "Argentina", countryCode: "AR", lat: -22.79, lng: -65.22 },
  { city: "Villa La Angostura", country: "Argentina", countryCode: "AR", lat: -40.76, lng: -71.65 },
  { city: "El Bolson", country: "Argentina", countryCode: "AR", lat: -41.97, lng: -71.53 },
  { city: "San Rafael", country: "Argentina", countryCode: "AR", lat: -34.62, lng: -68.33 },
  { city: "Trelew", country: "Argentina", countryCode: "AR", lat: -43.25, lng: -65.31 },
  {
    city: "Colonia Carlos Pellegrini",
    country: "Argentina",
    countryCode: "AR",
    lat: -28.53,
    lng: -57.17,
  },

  // ── BRAZIL ──
  { city: "Alter do Chao", country: "Brazil", countryCode: "BR", lat: -2.5, lng: -54.95 },
  { city: "Jalapao", country: "Brazil", countryCode: "BR", lat: -10.47, lng: -46.93 },
  { city: "Pipa", country: "Brazil", countryCode: "BR", lat: -6.23, lng: -35.06 },
  { city: "Sao Luis", country: "Brazil", countryCode: "BR", lat: -2.53, lng: -44.28 },
  { city: "Olinda", country: "Brazil", countryCode: "BR", lat: -8.01, lng: -34.86 },
  { city: "Petropolis", country: "Brazil", countryCode: "BR", lat: -22.51, lng: -43.18 },
  { city: "Ilha Grande", country: "Brazil", countryCode: "BR", lat: -23.15, lng: -44.23 },
  { city: "Praia do Forte", country: "Brazil", countryCode: "BR", lat: -12.57, lng: -38.0 },
  { city: "Campos do Jordao", country: "Brazil", countryCode: "BR", lat: -22.74, lng: -45.59 },
  { city: "Itacare", country: "Brazil", countryCode: "BR", lat: -14.28, lng: -38.99 },
  { city: "Morro de Sao Paulo", country: "Brazil", countryCode: "BR", lat: -13.38, lng: -38.91 },
  { city: "Belem", country: "Brazil", countryCode: "BR", lat: -1.46, lng: -48.5 },
  { city: "Pantanal", country: "Brazil", countryCode: "BR", lat: -19.0, lng: -57.65 },

  // ── CHILE ──
  { city: "Arica", country: "Chile", countryCode: "CL", lat: -18.48, lng: -70.33 },
  { city: "Concepcion", country: "Chile", countryCode: "CL", lat: -36.83, lng: -73.05 },
  { city: "Puerto Varas", country: "Chile", countryCode: "CL", lat: -41.32, lng: -72.99 },
  { city: "Puerto Montt", country: "Chile", countryCode: "CL", lat: -41.47, lng: -72.94 },
  { city: "Carretera Austral", country: "Chile", countryCode: "CL", lat: -44.07, lng: -72.67 },
  { city: "Isla Navarino", country: "Chile", countryCode: "CL", lat: -54.93, lng: -67.63 },
  { city: "Elqui Valley", country: "Chile", countryCode: "CL", lat: -30.14, lng: -70.69 },

  // ── OTHER SOUTH AMERICA ──
  { city: "Salinas", country: "Ecuador", countryCode: "EC", lat: -2.22, lng: -80.96 },
  { city: "Cotopaxi", country: "Ecuador", countryCode: "EC", lat: -0.68, lng: -78.44 },
  { city: "Vilcabamba", country: "Ecuador", countryCode: "EC", lat: -4.26, lng: -79.22 },
  { city: "Canoa", country: "Ecuador", countryCode: "EC", lat: -0.47, lng: -80.13 },
  { city: "Puerto Lopez", country: "Ecuador", countryCode: "EC", lat: -1.55, lng: -80.81 },
  { city: "Coroico", country: "Bolivia", countryCode: "BO", lat: -16.18, lng: -67.73 },
  { city: "Samaipata", country: "Bolivia", countryCode: "BO", lat: -18.18, lng: -63.87 },
  { city: "Rurrenabaque", country: "Bolivia", countryCode: "BO", lat: -14.44, lng: -67.53 },
  { city: "Salto", country: "Uruguay", countryCode: "UY", lat: -31.39, lng: -57.97 },
  { city: "Rocha", country: "Uruguay", countryCode: "UY", lat: -34.48, lng: -54.3 },
  { city: "La Pedrera", country: "Uruguay", countryCode: "UY", lat: -34.57, lng: -53.97 },
  { city: "Kaieteur Falls", country: "Guyana", countryCode: "GY", lat: 5.18, lng: -59.48 },

  // ── AUSTRALIA ──
  { city: "Exmouth", country: "Australia", countryCode: "AU", lat: -21.93, lng: 114.12 },
  { city: "Esperance", country: "Australia", countryCode: "AU", lat: -33.86, lng: 121.89 },
  { city: "Rottnest Island", country: "Australia", countryCode: "AU", lat: -32.0, lng: 115.52 },
  { city: "Lord Howe Island", country: "Australia", countryCode: "AU", lat: -31.56, lng: 159.08 },
  { city: "Jervis Bay", country: "Australia", countryCode: "AU", lat: -35.07, lng: 150.73 },
  { city: "Phillip Island", country: "Australia", countryCode: "AU", lat: -38.49, lng: 145.23 },
  { city: "Great Ocean Road", country: "Australia", countryCode: "AU", lat: -38.68, lng: 143.47 },
  { city: "Daintree", country: "Australia", countryCode: "AU", lat: -16.25, lng: 145.42 },
  { city: "Fremantle", country: "Australia", countryCode: "AU", lat: -32.06, lng: 115.75 },
  { city: "Launceston", country: "Australia", countryCode: "AU", lat: -41.44, lng: 147.14 },
  { city: "Coffs Harbour", country: "Australia", countryCode: "AU", lat: -30.3, lng: 153.11 },
  { city: "Hervey Bay", country: "Australia", countryCode: "AU", lat: -25.29, lng: 152.85 },
  { city: "Hamilton Island", country: "Australia", countryCode: "AU", lat: -20.35, lng: 148.95 },
  { city: "Yarra Valley", country: "Australia", countryCode: "AU", lat: -37.74, lng: 145.52 },
  { city: "Mclaren Vale", country: "Australia", countryCode: "AU", lat: -35.22, lng: 138.55 },
  { city: "Shark Bay", country: "Australia", countryCode: "AU", lat: -25.75, lng: 113.7 },

  // ── NEW ZEALAND ──
  { city: "Aoraki", country: "New Zealand", countryCode: "NZ", lat: -43.73, lng: 170.1 },
  { city: "Paihia", country: "New Zealand", countryCode: "NZ", lat: -35.28, lng: 174.09 },
  { city: "Waitomo", country: "New Zealand", countryCode: "NZ", lat: -38.26, lng: 175.1 },
  { city: "Fiordland", country: "New Zealand", countryCode: "NZ", lat: -45.42, lng: 167.72 },
  { city: "Raglan", country: "New Zealand", countryCode: "NZ", lat: -37.8, lng: 174.88 },
  { city: "Hokitika", country: "New Zealand", countryCode: "NZ", lat: -42.72, lng: 170.97 },
  { city: "Stewart Island", country: "New Zealand", countryCode: "NZ", lat: -46.9, lng: 168.12 },
  { city: "Punakaiki", country: "New Zealand", countryCode: "NZ", lat: -42.11, lng: 171.33 },
  { city: "Hanmer Springs", country: "New Zealand", countryCode: "NZ", lat: -42.52, lng: 172.83 },
  { city: "Akaroa", country: "New Zealand", countryCode: "NZ", lat: -43.81, lng: 172.97 },
  { city: "Oamaru", country: "New Zealand", countryCode: "NZ", lat: -45.1, lng: 171.0 },
  { city: "Tauranga", country: "New Zealand", countryCode: "NZ", lat: -37.69, lng: 176.17 },

  // ── PACIFIC ISLANDS ──
  { city: "Taveuni", country: "Fiji", countryCode: "FJ", lat: -16.87, lng: -179.97 },
  { city: "Savusavu", country: "Fiji", countryCode: "FJ", lat: -16.78, lng: 179.34 },
  { city: "Rangiroa", country: "French Polynesia", countryCode: "PF", lat: -15.13, lng: -147.65 },
  { city: "Huahine", country: "French Polynesia", countryCode: "PF", lat: -16.73, lng: -151.0 },
  { city: "Raiatea", country: "French Polynesia", countryCode: "PF", lat: -16.83, lng: -151.43 },
  { city: "Espiritu Santo", country: "Vanuatu", countryCode: "VU", lat: -15.38, lng: 166.84 },
  { city: "Aitutaki", country: "Cook Islands", countryCode: "CK", lat: -18.86, lng: -159.79 },
  { city: "Savai'i", country: "Samoa", countryCode: "WS", lat: -13.63, lng: -172.4 },
  { city: "Upolu", country: "Samoa", countryCode: "WS", lat: -13.85, lng: -171.76 },
  { city: "Majuro", country: "Marshall Islands", countryCode: "MH", lat: 7.09, lng: 171.38 },
  { city: "Pohnpei", country: "Micronesia", countryCode: "FM", lat: 6.88, lng: 158.23 },
  { city: "Yap", country: "Micronesia", countryCode: "FM", lat: 9.51, lng: 138.13 },
  { city: "Koror", country: "Palau", countryCode: "PW", lat: 7.34, lng: 134.47 },
  { city: "Nauru", country: "Nauru", countryCode: "NR", lat: -0.52, lng: 166.93 },
  { city: "Tarawa", country: "Kiribati", countryCode: "KI", lat: 1.45, lng: 173.0 },
  { city: "Funafuti", country: "Tuvalu", countryCode: "TV", lat: -8.52, lng: 179.2 },
];

// ── Build and insert ──
const filePath = resolve(process.cwd(), "src/data/cities.ts");
const content = readFileSync(filePath, "utf-8");

// Find the closing "];" and insert before it
const closingIndex = content.lastIndexOf("];");
if (closingIndex === -1) {
  console.error("Could not find closing ]; in cities.ts");
  process.exit(1);
}

// Check for existing cities to avoid duplicates
const existingCities = new Set<string>();
const cityRegex = /city:\s*"([^"]+)"/g;
let match: RegExpExecArray | null;
while ((match = cityRegex.exec(content)) !== null) {
  existingCities.add(match[1].toLowerCase());
}

const newEntries = NEW_CITIES.filter((c) => !existingCities.has(c.city.toLowerCase()));
console.log(
  `${NEW_CITIES.length} total new cities, ${NEW_CITIES.length - newEntries.length} duplicates skipped, ${newEntries.length} to add.`
);

if (newEntries.length === 0) {
  console.log("Nothing to add.");
  process.exit(0);
}

// Format entries
const lines = newEntries.map((c) => {
  const lat = c.lat.toFixed(2);
  const lng = c.lng.toFixed(2);
  return `  { city: "${c.city}", country: "${c.country}", countryCode: "${c.countryCode}", lat: ${lat}, lng: ${lng} },`;
});

const insertion = "\n  // Additional cities (batch expansion)\n" + lines.join("\n") + "\n";
const newContent = content.slice(0, closingIndex) + insertion + content.slice(closingIndex);

writeFileSync(filePath, newContent, "utf-8");

// Count total
const totalCities = (newContent.match(/{ city:/g) || []).length;
console.log(`Done! Total cities: ${totalCities}`);

// Update header
const updated = newContent.replace(
  /Travel Pro — Global Travel Destinations \([^)]+\)/,
  `Travel Pro — Global Travel Destinations (${totalCities.toLocaleString()}+)`
);
writeFileSync(filePath, updated, "utf-8");
console.log(`Header updated to ${totalCities}+`);
