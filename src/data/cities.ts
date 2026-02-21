// ============================================================
// Travel Pro — Global Travel Destinations (750+)
// Used by the CityCombobox for city selection
// ============================================================

export interface CityEntry {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

export const CITIES: CityEntry[] = [
  // ══════════════════════════════════════════════════════════════
  // EAST ASIA
  // ══════════════════════════════════════════════════════════════

  // Japan
  { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.68, lng: 139.69, popular: true },
  { city: "Kyoto", country: "Japan", countryCode: "JP", lat: 35.01, lng: 135.77 },
  { city: "Osaka", country: "Japan", countryCode: "JP", lat: 34.69, lng: 135.50 },
  { city: "Hiroshima", country: "Japan", countryCode: "JP", lat: 34.40, lng: 132.46 },
  { city: "Nara", country: "Japan", countryCode: "JP", lat: 34.69, lng: 135.80 },
  { city: "Fukuoka", country: "Japan", countryCode: "JP", lat: 33.59, lng: 130.40 },
  { city: "Sapporo", country: "Japan", countryCode: "JP", lat: 43.06, lng: 141.35 },
  { city: "Nagoya", country: "Japan", countryCode: "JP", lat: 35.18, lng: 136.91 },
  { city: "Kobe", country: "Japan", countryCode: "JP", lat: 34.69, lng: 135.20 },
  { city: "Yokohama", country: "Japan", countryCode: "JP", lat: 35.44, lng: 139.64 },
  { city: "Okinawa", country: "Japan", countryCode: "JP", lat: 26.34, lng: 127.80 },
  { city: "Kanazawa", country: "Japan", countryCode: "JP", lat: 36.56, lng: 136.65 },
  { city: "Nikko", country: "Japan", countryCode: "JP", lat: 36.75, lng: 139.60 },
  { city: "Hakone", country: "Japan", countryCode: "JP", lat: 35.23, lng: 139.11 },
  { city: "Takayama", country: "Japan", countryCode: "JP", lat: 36.15, lng: 137.25 },
  { city: "Nagasaki", country: "Japan", countryCode: "JP", lat: 32.75, lng: 129.88 },

  // South Korea
  { city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.57, lng: 126.98, popular: true },
  { city: "Busan", country: "South Korea", countryCode: "KR", lat: 35.18, lng: 129.08 },
  { city: "Jeju", country: "South Korea", countryCode: "KR", lat: 33.50, lng: 126.53 },
  { city: "Incheon", country: "South Korea", countryCode: "KR", lat: 37.46, lng: 126.71 },
  { city: "Gyeongju", country: "South Korea", countryCode: "KR", lat: 35.86, lng: 129.22 },
  { city: "Daegu", country: "South Korea", countryCode: "KR", lat: 35.87, lng: 128.60 },

  // Taiwan
  { city: "Taipei", country: "Taiwan", countryCode: "TW", lat: 25.03, lng: 121.57 },
  { city: "Kaohsiung", country: "Taiwan", countryCode: "TW", lat: 22.63, lng: 120.30 },
  { city: "Taichung", country: "Taiwan", countryCode: "TW", lat: 24.15, lng: 120.67 },
  { city: "Tainan", country: "Taiwan", countryCode: "TW", lat: 22.99, lng: 120.20 },
  { city: "Hualien", country: "Taiwan", countryCode: "TW", lat: 23.99, lng: 121.60 },

  // China & SARs
  { city: "Hong Kong", country: "China", countryCode: "HK", lat: 22.32, lng: 114.17 },
  { city: "Macau", country: "China", countryCode: "MO", lat: 22.20, lng: 113.54 },
  { city: "Shanghai", country: "China", countryCode: "CN", lat: 31.23, lng: 121.47 },
  { city: "Beijing", country: "China", countryCode: "CN", lat: 39.90, lng: 116.40 },
  { city: "Guangzhou", country: "China", countryCode: "CN", lat: 23.13, lng: 113.26 },
  { city: "Chengdu", country: "China", countryCode: "CN", lat: 30.57, lng: 104.07 },
  { city: "Xi'an", country: "China", countryCode: "CN", lat: 34.26, lng: 108.94 },
  { city: "Shenzhen", country: "China", countryCode: "CN", lat: 22.54, lng: 114.06 },
  { city: "Hangzhou", country: "China", countryCode: "CN", lat: 30.27, lng: 120.15 },
  { city: "Guilin", country: "China", countryCode: "CN", lat: 25.27, lng: 110.29 },
  { city: "Kunming", country: "China", countryCode: "CN", lat: 25.04, lng: 102.68 },
  { city: "Lhasa", country: "China", countryCode: "CN", lat: 29.65, lng: 91.17 },
  { city: "Suzhou", country: "China", countryCode: "CN", lat: 31.30, lng: 120.62 },
  { city: "Nanjing", country: "China", countryCode: "CN", lat: 32.06, lng: 118.80 },
  { city: "Chongqing", country: "China", countryCode: "CN", lat: 29.56, lng: 106.55 },
  { city: "Zhangjiajie", country: "China", countryCode: "CN", lat: 29.12, lng: 110.48 },
  { city: "Harbin", country: "China", countryCode: "CN", lat: 45.80, lng: 126.53 },

  // Mongolia
  { city: "Ulaanbaatar", country: "Mongolia", countryCode: "MN", lat: 47.92, lng: 106.91 },

  // ══════════════════════════════════════════════════════════════
  // SOUTHEAST ASIA
  // ══════════════════════════════════════════════════════════════

  // Thailand
  { city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.76, lng: 100.50, popular: true },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", lat: 18.79, lng: 98.98 },
  { city: "Phuket", country: "Thailand", countryCode: "TH", lat: 7.88, lng: 98.39 },
  { city: "Krabi", country: "Thailand", countryCode: "TH", lat: 8.09, lng: 98.91 },
  { city: "Koh Samui", country: "Thailand", countryCode: "TH", lat: 9.51, lng: 100.06 },
  { city: "Chiang Rai", country: "Thailand", countryCode: "TH", lat: 19.91, lng: 99.83 },
  { city: "Pattaya", country: "Thailand", countryCode: "TH", lat: 12.93, lng: 100.88 },
  { city: "Koh Phangan", country: "Thailand", countryCode: "TH", lat: 9.72, lng: 100.03 },
  { city: "Pai", country: "Thailand", countryCode: "TH", lat: 19.36, lng: 98.44 },
  { city: "Ayutthaya", country: "Thailand", countryCode: "TH", lat: 14.35, lng: 100.57 },

  // Vietnam
  { city: "Hanoi", country: "Vietnam", countryCode: "VN", lat: 21.03, lng: 105.85 },
  { city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", lat: 10.82, lng: 106.63 },
  { city: "Da Nang", country: "Vietnam", countryCode: "VN", lat: 16.05, lng: 108.22 },
  { city: "Hoi An", country: "Vietnam", countryCode: "VN", lat: 15.88, lng: 108.34 },
  { city: "Hue", country: "Vietnam", countryCode: "VN", lat: 16.46, lng: 107.60 },
  { city: "Nha Trang", country: "Vietnam", countryCode: "VN", lat: 12.24, lng: 109.19 },
  { city: "Phu Quoc", country: "Vietnam", countryCode: "VN", lat: 10.23, lng: 103.97 },
  { city: "Sa Pa", country: "Vietnam", countryCode: "VN", lat: 22.34, lng: 103.84 },
  { city: "Ha Long Bay", country: "Vietnam", countryCode: "VN", lat: 20.95, lng: 107.07 },
  { city: "Dalat", country: "Vietnam", countryCode: "VN", lat: 11.94, lng: 108.44 },

  // Indonesia
  { city: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.34, lng: 115.09, popular: true },
  { city: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.21, lng: 106.85 },
  { city: "Yogyakarta", country: "Indonesia", countryCode: "ID", lat: -7.80, lng: 110.36 },
  { city: "Lombok", country: "Indonesia", countryCode: "ID", lat: -8.65, lng: 116.35 },
  { city: "Komodo", country: "Indonesia", countryCode: "ID", lat: -8.55, lng: 119.48 },
  { city: "Bandung", country: "Indonesia", countryCode: "ID", lat: -6.91, lng: 107.61 },
  { city: "Surabaya", country: "Indonesia", countryCode: "ID", lat: -7.25, lng: 112.75 },
  { city: "Raja Ampat", country: "Indonesia", countryCode: "ID", lat: -1.10, lng: 130.52 },

  // Singapore & Malaysia
  { city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.35, lng: 103.82, popular: true },
  { city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.14, lng: 101.69 },
  { city: "Penang", country: "Malaysia", countryCode: "MY", lat: 5.41, lng: 100.33 },
  { city: "Langkawi", country: "Malaysia", countryCode: "MY", lat: 6.35, lng: 99.80 },
  { city: "Malacca", country: "Malaysia", countryCode: "MY", lat: 2.19, lng: 102.25 },
  { city: "Kota Kinabalu", country: "Malaysia", countryCode: "MY", lat: 5.98, lng: 116.07 },
  { city: "Ipoh", country: "Malaysia", countryCode: "MY", lat: 4.60, lng: 101.07 },
  { city: "Kuching", country: "Malaysia", countryCode: "MY", lat: 1.55, lng: 110.35 },

  // Philippines
  { city: "Manila", country: "Philippines", countryCode: "PH", lat: 14.60, lng: 120.98 },
  { city: "Cebu", country: "Philippines", countryCode: "PH", lat: 10.32, lng: 123.89 },
  { city: "Palawan", country: "Philippines", countryCode: "PH", lat: 10.17, lng: 118.74 },
  { city: "Boracay", country: "Philippines", countryCode: "PH", lat: 11.97, lng: 121.92 },
  { city: "Siargao", country: "Philippines", countryCode: "PH", lat: 9.85, lng: 126.05 },
  { city: "Bohol", country: "Philippines", countryCode: "PH", lat: 9.85, lng: 124.01 },
  { city: "Davao", country: "Philippines", countryCode: "PH", lat: 7.19, lng: 125.46 },

  // Cambodia & Laos
  { city: "Siem Reap", country: "Cambodia", countryCode: "KH", lat: 13.36, lng: 103.86 },
  { city: "Phnom Penh", country: "Cambodia", countryCode: "KH", lat: 11.56, lng: 104.93 },
  { city: "Sihanoukville", country: "Cambodia", countryCode: "KH", lat: 10.63, lng: 103.50 },
  { city: "Luang Prabang", country: "Laos", countryCode: "LA", lat: 19.89, lng: 102.13 },
  { city: "Vientiane", country: "Laos", countryCode: "LA", lat: 17.97, lng: 102.63 },
  { city: "Vang Vieng", country: "Laos", countryCode: "LA", lat: 18.92, lng: 102.45 },

  // Myanmar
  { city: "Yangon", country: "Myanmar", countryCode: "MM", lat: 16.87, lng: 96.20 },
  { city: "Bagan", country: "Myanmar", countryCode: "MM", lat: 21.17, lng: 94.86 },
  { city: "Mandalay", country: "Myanmar", countryCode: "MM", lat: 21.97, lng: 96.08 },
  { city: "Inle Lake", country: "Myanmar", countryCode: "MM", lat: 20.58, lng: 96.92 },

  // Brunei & Timor-Leste
  { city: "Bandar Seri Begawan", country: "Brunei", countryCode: "BN", lat: 4.94, lng: 114.95 },
  { city: "Dili", country: "Timor-Leste", countryCode: "TL", lat: -8.56, lng: 125.57 },

  // ══════════════════════════════════════════════════════════════
  // SOUTH ASIA
  // ══════════════════════════════════════════════════════════════

  // India
  { city: "Mumbai", country: "India", countryCode: "IN", lat: 19.08, lng: 72.88 },
  { city: "Delhi", country: "India", countryCode: "IN", lat: 28.61, lng: 77.21 },
  { city: "Jaipur", country: "India", countryCode: "IN", lat: 26.91, lng: 75.79 },
  { city: "Goa", country: "India", countryCode: "IN", lat: 15.50, lng: 73.83 },
  { city: "Bangalore", country: "India", countryCode: "IN", lat: 12.97, lng: 77.59 },
  { city: "Kolkata", country: "India", countryCode: "IN", lat: 22.57, lng: 88.36 },
  { city: "Varanasi", country: "India", countryCode: "IN", lat: 25.32, lng: 83.01 },
  { city: "Agra", country: "India", countryCode: "IN", lat: 27.18, lng: 78.02 },
  { city: "Kerala", country: "India", countryCode: "IN", lat: 10.85, lng: 76.27 },
  { city: "Udaipur", country: "India", countryCode: "IN", lat: 24.59, lng: 73.69 },
  { city: "Jodhpur", country: "India", countryCode: "IN", lat: 26.24, lng: 73.02 },
  { city: "Hyderabad", country: "India", countryCode: "IN", lat: 17.39, lng: 78.49 },
  { city: "Chennai", country: "India", countryCode: "IN", lat: 13.08, lng: 80.27 },
  { city: "Amritsar", country: "India", countryCode: "IN", lat: 31.63, lng: 74.87 },
  { city: "Rishikesh", country: "India", countryCode: "IN", lat: 30.09, lng: 78.27 },
  { city: "Jaisalmer", country: "India", countryCode: "IN", lat: 26.91, lng: 70.92 },
  { city: "Darjeeling", country: "India", countryCode: "IN", lat: 27.04, lng: 88.26 },
  { city: "Pune", country: "India", countryCode: "IN", lat: 18.52, lng: 73.86 },
  { city: "Ahmedabad", country: "India", countryCode: "IN", lat: 23.02, lng: 72.57 },
  { city: "Shimla", country: "India", countryCode: "IN", lat: 31.10, lng: 77.17 },
  { city: "Leh", country: "India", countryCode: "IN", lat: 34.17, lng: 77.58 },

  // Nepal & Bhutan
  { city: "Kathmandu", country: "Nepal", countryCode: "NP", lat: 27.72, lng: 85.32 },
  { city: "Pokhara", country: "Nepal", countryCode: "NP", lat: 28.21, lng: 83.99 },
  { city: "Chitwan", country: "Nepal", countryCode: "NP", lat: 27.53, lng: 84.35 },
  { city: "Thimphu", country: "Bhutan", countryCode: "BT", lat: 27.47, lng: 89.64 },
  { city: "Paro", country: "Bhutan", countryCode: "BT", lat: 27.43, lng: 89.42 },

  // Sri Lanka & Maldives
  { city: "Colombo", country: "Sri Lanka", countryCode: "LK", lat: 6.93, lng: 79.84 },
  { city: "Kandy", country: "Sri Lanka", countryCode: "LK", lat: 7.29, lng: 80.64 },
  { city: "Galle", country: "Sri Lanka", countryCode: "LK", lat: 6.04, lng: 80.22 },
  { city: "Ella", country: "Sri Lanka", countryCode: "LK", lat: 6.87, lng: 81.05 },
  { city: "Sigiriya", country: "Sri Lanka", countryCode: "LK", lat: 7.96, lng: 80.76 },
  { city: "Maldives", country: "Maldives", countryCode: "MV", lat: 4.17, lng: 73.51 },

  // Bangladesh & Pakistan
  { city: "Dhaka", country: "Bangladesh", countryCode: "BD", lat: 23.81, lng: 90.41 },
  { city: "Cox's Bazar", country: "Bangladesh", countryCode: "BD", lat: 21.43, lng: 92.01 },
  { city: "Islamabad", country: "Pakistan", countryCode: "PK", lat: 33.69, lng: 73.04 },
  { city: "Lahore", country: "Pakistan", countryCode: "PK", lat: 31.55, lng: 74.35 },
  { city: "Karachi", country: "Pakistan", countryCode: "PK", lat: 24.86, lng: 67.01 },

  // ══════════════════════════════════════════════════════════════
  // CENTRAL ASIA
  // ══════════════════════════════════════════════════════════════
  { city: "Tashkent", country: "Uzbekistan", countryCode: "UZ", lat: 41.30, lng: 69.28 },
  { city: "Samarkand", country: "Uzbekistan", countryCode: "UZ", lat: 39.65, lng: 66.96 },
  { city: "Bukhara", country: "Uzbekistan", countryCode: "UZ", lat: 39.77, lng: 64.42 },
  { city: "Almaty", country: "Kazakhstan", countryCode: "KZ", lat: 43.24, lng: 76.95 },
  { city: "Astana", country: "Kazakhstan", countryCode: "KZ", lat: 51.17, lng: 71.43 },
  { city: "Bishkek", country: "Kyrgyzstan", countryCode: "KG", lat: 42.87, lng: 74.59 },
  { city: "Dushanbe", country: "Tajikistan", countryCode: "TJ", lat: 38.56, lng: 68.77 },
  { city: "Ashgabat", country: "Turkmenistan", countryCode: "TM", lat: 37.96, lng: 58.33 },

  // ══════════════════════════════════════════════════════════════
  // WESTERN EUROPE
  // ══════════════════════════════════════════════════════════════

  // France
  { city: "Paris", country: "France", countryCode: "FR", lat: 48.86, lng: 2.35, popular: true },
  { city: "Nice", country: "France", countryCode: "FR", lat: 43.71, lng: 7.26 },
  { city: "Lyon", country: "France", countryCode: "FR", lat: 45.76, lng: 4.84 },
  { city: "Marseille", country: "France", countryCode: "FR", lat: 43.30, lng: 5.37 },
  { city: "Bordeaux", country: "France", countryCode: "FR", lat: 44.84, lng: -0.58 },
  { city: "Strasbourg", country: "France", countryCode: "FR", lat: 48.57, lng: 7.75 },
  { city: "Toulouse", country: "France", countryCode: "FR", lat: 43.60, lng: 1.44 },
  { city: "Montpellier", country: "France", countryCode: "FR", lat: 43.61, lng: 3.88 },
  { city: "Cannes", country: "France", countryCode: "FR", lat: 43.55, lng: 7.02 },
  { city: "Avignon", country: "France", countryCode: "FR", lat: 43.95, lng: 4.81 },
  { city: "Lille", country: "France", countryCode: "FR", lat: 50.63, lng: 3.06 },
  { city: "Nantes", country: "France", countryCode: "FR", lat: 47.22, lng: -1.55 },
  { city: "Colmar", country: "France", countryCode: "FR", lat: 48.08, lng: 7.36 },
  { city: "Annecy", country: "France", countryCode: "FR", lat: 45.90, lng: 6.13 },

  // Spain
  { city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.39, lng: 2.17, popular: true },
  { city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.42, lng: -3.70 },
  { city: "Seville", country: "Spain", countryCode: "ES", lat: 37.39, lng: -5.98 },
  { city: "Malaga", country: "Spain", countryCode: "ES", lat: 36.72, lng: -4.42 },
  { city: "Valencia", country: "Spain", countryCode: "ES", lat: 39.47, lng: -0.38 },
  { city: "Granada", country: "Spain", countryCode: "ES", lat: 37.18, lng: -3.60 },
  { city: "San Sebastian", country: "Spain", countryCode: "ES", lat: 43.32, lng: -1.98 },
  { city: "Ibiza", country: "Spain", countryCode: "ES", lat: 38.91, lng: 1.43 },
  { city: "Palma de Mallorca", country: "Spain", countryCode: "ES", lat: 39.57, lng: 2.65 },
  { city: "Bilbao", country: "Spain", countryCode: "ES", lat: 43.26, lng: -2.93 },
  { city: "Toledo", country: "Spain", countryCode: "ES", lat: 39.86, lng: -4.02 },
  { city: "Cordoba", country: "Spain", countryCode: "ES", lat: 37.88, lng: -4.78 },
  { city: "Tenerife", country: "Spain", countryCode: "ES", lat: 28.29, lng: -16.63 },
  { city: "Las Palmas", country: "Spain", countryCode: "ES", lat: 28.10, lng: -15.41 },
  { city: "Salamanca", country: "Spain", countryCode: "ES", lat: 40.97, lng: -5.66 },
  { city: "Santiago de Compostela", country: "Spain", countryCode: "ES", lat: 42.88, lng: -8.54 },

  // Italy
  { city: "Rome", country: "Italy", countryCode: "IT", lat: 41.90, lng: 12.50, popular: true },
  { city: "Florence", country: "Italy", countryCode: "IT", lat: 43.77, lng: 11.25 },
  { city: "Venice", country: "Italy", countryCode: "IT", lat: 45.44, lng: 12.32 },
  { city: "Milan", country: "Italy", countryCode: "IT", lat: 45.46, lng: 9.19 },
  { city: "Amalfi Coast", country: "Italy", countryCode: "IT", lat: 40.63, lng: 14.60 },
  { city: "Naples", country: "Italy", countryCode: "IT", lat: 40.85, lng: 14.27 },
  { city: "Cinque Terre", country: "Italy", countryCode: "IT", lat: 44.13, lng: 9.71 },
  { city: "Bologna", country: "Italy", countryCode: "IT", lat: 44.49, lng: 11.34 },
  { city: "Sicily", country: "Italy", countryCode: "IT", lat: 37.60, lng: 14.02 },
  { city: "Turin", country: "Italy", countryCode: "IT", lat: 45.07, lng: 7.69 },
  { city: "Verona", country: "Italy", countryCode: "IT", lat: 45.44, lng: 10.99 },
  { city: "Sardinia", country: "Italy", countryCode: "IT", lat: 39.22, lng: 9.12 },
  { city: "Lake Como", country: "Italy", countryCode: "IT", lat: 45.99, lng: 9.26 },
  { city: "Pisa", country: "Italy", countryCode: "IT", lat: 43.72, lng: 10.40 },
  { city: "Siena", country: "Italy", countryCode: "IT", lat: 43.32, lng: 11.33 },
  { city: "Genoa", country: "Italy", countryCode: "IT", lat: 44.41, lng: 8.93 },
  { city: "Lecce", country: "Italy", countryCode: "IT", lat: 40.35, lng: 18.17 },
  { city: "Palermo", country: "Italy", countryCode: "IT", lat: 38.12, lng: 13.36 },

  // United Kingdom
  { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.51, lng: -0.13, popular: true },
  { city: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.95, lng: -3.19 },
  { city: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.48, lng: -2.24 },
  { city: "Bath", country: "United Kingdom", countryCode: "GB", lat: 51.38, lng: -2.36 },
  { city: "Liverpool", country: "United Kingdom", countryCode: "GB", lat: 53.41, lng: -2.98 },
  { city: "Oxford", country: "United Kingdom", countryCode: "GB", lat: 51.75, lng: -1.25 },
  { city: "Cambridge", country: "United Kingdom", countryCode: "GB", lat: 52.21, lng: 0.12 },
  { city: "York", country: "United Kingdom", countryCode: "GB", lat: 53.96, lng: -1.08 },
  { city: "Glasgow", country: "United Kingdom", countryCode: "GB", lat: 55.86, lng: -4.25 },
  { city: "Bristol", country: "United Kingdom", countryCode: "GB", lat: 51.45, lng: -2.59 },
  { city: "Belfast", country: "United Kingdom", countryCode: "GB", lat: 54.60, lng: -5.93 },
  { city: "Cardiff", country: "United Kingdom", countryCode: "GB", lat: 51.48, lng: -3.18 },
  { city: "Inverness", country: "United Kingdom", countryCode: "GB", lat: 57.48, lng: -4.22 },
  { city: "Brighton", country: "United Kingdom", countryCode: "GB", lat: 50.82, lng: -0.14 },

  // Germany
  { city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lng: 13.41 },
  { city: "Munich", country: "Germany", countryCode: "DE", lat: 48.14, lng: 11.58 },
  { city: "Hamburg", country: "Germany", countryCode: "DE", lat: 53.55, lng: 9.99 },
  { city: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.11, lng: 8.68 },
  { city: "Cologne", country: "Germany", countryCode: "DE", lat: 50.94, lng: 6.96 },
  { city: "Dresden", country: "Germany", countryCode: "DE", lat: 51.05, lng: 13.74 },
  { city: "Dusseldorf", country: "Germany", countryCode: "DE", lat: 51.23, lng: 6.78 },
  { city: "Stuttgart", country: "Germany", countryCode: "DE", lat: 48.78, lng: 9.18 },
  { city: "Heidelberg", country: "Germany", countryCode: "DE", lat: 49.40, lng: 8.69 },
  { city: "Nuremberg", country: "Germany", countryCode: "DE", lat: 49.45, lng: 11.08 },
  { city: "Leipzig", country: "Germany", countryCode: "DE", lat: 51.34, lng: 12.37 },
  { city: "Freiburg", country: "Germany", countryCode: "DE", lat: 47.99, lng: 7.85 },

  // Netherlands
  { city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.37, lng: 4.90, popular: true },
  { city: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.92, lng: 4.48 },
  { city: "Utrecht", country: "Netherlands", countryCode: "NL", lat: 52.09, lng: 5.12 },
  { city: "The Hague", country: "Netherlands", countryCode: "NL", lat: 52.08, lng: 4.30 },

  // Belgium
  { city: "Brussels", country: "Belgium", countryCode: "BE", lat: 50.85, lng: 4.35 },
  { city: "Bruges", country: "Belgium", countryCode: "BE", lat: 51.21, lng: 3.22 },
  { city: "Ghent", country: "Belgium", countryCode: "BE", lat: 51.05, lng: 3.72 },
  { city: "Antwerp", country: "Belgium", countryCode: "BE", lat: 51.22, lng: 4.40 },

  // Austria
  { city: "Vienna", country: "Austria", countryCode: "AT", lat: 48.21, lng: 16.37 },
  { city: "Salzburg", country: "Austria", countryCode: "AT", lat: 47.81, lng: 13.04 },
  { city: "Innsbruck", country: "Austria", countryCode: "AT", lat: 47.26, lng: 11.39 },
  { city: "Graz", country: "Austria", countryCode: "AT", lat: 47.07, lng: 15.44 },
  { city: "Hallstatt", country: "Austria", countryCode: "AT", lat: 47.56, lng: 13.65 },

  // Switzerland
  { city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.37, lng: 8.54 },
  { city: "Geneva", country: "Switzerland", countryCode: "CH", lat: 46.20, lng: 6.14 },
  { city: "Lucerne", country: "Switzerland", countryCode: "CH", lat: 47.05, lng: 8.31 },
  { city: "Interlaken", country: "Switzerland", countryCode: "CH", lat: 46.69, lng: 7.86 },
  { city: "Bern", country: "Switzerland", countryCode: "CH", lat: 46.95, lng: 7.45 },
  { city: "Zermatt", country: "Switzerland", countryCode: "CH", lat: 46.02, lng: 7.75 },
  { city: "Basel", country: "Switzerland", countryCode: "CH", lat: 47.56, lng: 7.59 },
  { city: "Lausanne", country: "Switzerland", countryCode: "CH", lat: 46.52, lng: 6.63 },

  // Ireland
  { city: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.35, lng: -6.26 },
  { city: "Galway", country: "Ireland", countryCode: "IE", lat: 53.27, lng: -9.06 },
  { city: "Cork", country: "Ireland", countryCode: "IE", lat: 51.90, lng: -8.47 },
  { city: "Killarney", country: "Ireland", countryCode: "IE", lat: 52.06, lng: -9.51 },

  // Portugal
  { city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.72, lng: -9.14, popular: true },
  { city: "Porto", country: "Portugal", countryCode: "PT", lat: 41.15, lng: -8.61 },
  { city: "Faro", country: "Portugal", countryCode: "PT", lat: 37.02, lng: -7.94 },
  { city: "Sintra", country: "Portugal", countryCode: "PT", lat: 38.80, lng: -9.38 },
  { city: "Madeira", country: "Portugal", countryCode: "PT", lat: 32.65, lng: -16.91 },
  { city: "Azores", country: "Portugal", countryCode: "PT", lat: 37.74, lng: -25.68 },
  { city: "Coimbra", country: "Portugal", countryCode: "PT", lat: 40.21, lng: -8.43 },
  { city: "Lagos", country: "Portugal", countryCode: "PT", lat: 37.10, lng: -8.67 },

  // Other Western Europe
  { city: "Luxembourg City", country: "Luxembourg", countryCode: "LU", lat: 49.61, lng: 6.13 },
  { city: "Monaco", country: "Monaco", countryCode: "MC", lat: 43.74, lng: 7.43 },
  { city: "Andorra la Vella", country: "Andorra", countryCode: "AD", lat: 42.51, lng: 1.52 },
  { city: "Liechtenstein", country: "Liechtenstein", countryCode: "LI", lat: 47.14, lng: 9.52 },

  // ══════════════════════════════════════════════════════════════
  // NORTHERN EUROPE
  // ══════════════════════════════════════════════════════════════

  // Scandinavia
  { city: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.68, lng: 12.57 },
  { city: "Aarhus", country: "Denmark", countryCode: "DK", lat: 56.16, lng: 10.20 },
  { city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.33, lng: 18.07 },
  { city: "Gothenburg", country: "Sweden", countryCode: "SE", lat: 57.71, lng: 11.97 },
  { city: "Malmo", country: "Sweden", countryCode: "SE", lat: 55.61, lng: 13.00 },
  { city: "Oslo", country: "Norway", countryCode: "NO", lat: 59.91, lng: 10.75 },
  { city: "Bergen", country: "Norway", countryCode: "NO", lat: 60.39, lng: 5.32 },
  { city: "Tromso", country: "Norway", countryCode: "NO", lat: 69.65, lng: 18.96 },
  { city: "Stavanger", country: "Norway", countryCode: "NO", lat: 58.97, lng: 5.73 },
  { city: "Lofoten", country: "Norway", countryCode: "NO", lat: 68.23, lng: 14.56 },
  { city: "Helsinki", country: "Finland", countryCode: "FI", lat: 60.17, lng: 24.94 },
  { city: "Rovaniemi", country: "Finland", countryCode: "FI", lat: 66.50, lng: 25.72 },
  { city: "Turku", country: "Finland", countryCode: "FI", lat: 60.45, lng: 22.27 },
  { city: "Reykjavik", country: "Iceland", countryCode: "IS", lat: 64.15, lng: -21.94 },
  { city: "Akureyri", country: "Iceland", countryCode: "IS", lat: 65.68, lng: -18.09 },
  { city: "Faroe Islands", country: "Denmark", countryCode: "FO", lat: 62.01, lng: -6.77 },

  // Baltic States
  { city: "Tallinn", country: "Estonia", countryCode: "EE", lat: 59.44, lng: 24.75 },
  { city: "Tartu", country: "Estonia", countryCode: "EE", lat: 58.38, lng: 26.72 },
  { city: "Riga", country: "Latvia", countryCode: "LV", lat: 56.95, lng: 24.11 },
  { city: "Vilnius", country: "Lithuania", countryCode: "LT", lat: 54.69, lng: 25.28 },
  { city: "Kaunas", country: "Lithuania", countryCode: "LT", lat: 54.90, lng: 23.90 },

  // ══════════════════════════════════════════════════════════════
  // CENTRAL & EASTERN EUROPE
  // ══════════════════════════════════════════════════════════════
  { city: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.08, lng: 14.44, popular: true },
  { city: "Cesky Krumlov", country: "Czech Republic", countryCode: "CZ", lat: 48.81, lng: 14.32 },
  { city: "Brno", country: "Czech Republic", countryCode: "CZ", lat: 49.20, lng: 16.61 },
  { city: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.50, lng: 19.04 },
  { city: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.23, lng: 21.01 },
  { city: "Krakow", country: "Poland", countryCode: "PL", lat: 50.06, lng: 19.94 },
  { city: "Gdansk", country: "Poland", countryCode: "PL", lat: 54.35, lng: 18.65 },
  { city: "Wroclaw", country: "Poland", countryCode: "PL", lat: 51.11, lng: 17.04 },
  { city: "Poznan", country: "Poland", countryCode: "PL", lat: 52.41, lng: 16.93 },
  { city: "Bucharest", country: "Romania", countryCode: "RO", lat: 44.43, lng: 26.10 },
  { city: "Cluj-Napoca", country: "Romania", countryCode: "RO", lat: 46.77, lng: 23.60 },
  { city: "Brasov", country: "Romania", countryCode: "RO", lat: 45.65, lng: 25.61 },
  { city: "Sibiu", country: "Romania", countryCode: "RO", lat: 45.80, lng: 24.15 },
  { city: "Sofia", country: "Bulgaria", countryCode: "BG", lat: 42.70, lng: 23.32 },
  { city: "Plovdiv", country: "Bulgaria", countryCode: "BG", lat: 42.15, lng: 24.75 },
  { city: "Belgrade", country: "Serbia", countryCode: "RS", lat: 44.79, lng: 20.47 },
  { city: "Novi Sad", country: "Serbia", countryCode: "RS", lat: 45.25, lng: 19.85 },
  { city: "Ljubljana", country: "Slovenia", countryCode: "SI", lat: 46.06, lng: 14.51 },
  { city: "Lake Bled", country: "Slovenia", countryCode: "SI", lat: 46.37, lng: 14.09 },
  { city: "Bratislava", country: "Slovakia", countryCode: "SK", lat: 48.15, lng: 17.11 },

  // Caucasus
  { city: "Tbilisi", country: "Georgia", countryCode: "GE", lat: 41.72, lng: 44.79 },
  { city: "Batumi", country: "Georgia", countryCode: "GE", lat: 41.65, lng: 41.64 },
  { city: "Yerevan", country: "Armenia", countryCode: "AM", lat: 40.18, lng: 44.51 },
  { city: "Baku", country: "Azerbaijan", countryCode: "AZ", lat: 40.41, lng: 49.87 },

  // Ukraine & Moldova
  { city: "Kyiv", country: "Ukraine", countryCode: "UA", lat: 50.45, lng: 30.52 },
  { city: "Lviv", country: "Ukraine", countryCode: "UA", lat: 49.84, lng: 24.03 },
  { city: "Odesa", country: "Ukraine", countryCode: "UA", lat: 46.48, lng: 30.74 },
  { city: "Chisinau", country: "Moldova", countryCode: "MD", lat: 47.01, lng: 28.86 },

  // ══════════════════════════════════════════════════════════════
  // SOUTHERN EUROPE & MEDITERRANEAN
  // ══════════════════════════════════════════════════════════════

  // Greece
  { city: "Athens", country: "Greece", countryCode: "GR", lat: 37.98, lng: 23.73 },
  { city: "Santorini", country: "Greece", countryCode: "GR", lat: 36.39, lng: 25.46, popular: true },
  { city: "Crete", country: "Greece", countryCode: "GR", lat: 35.24, lng: 24.90 },
  { city: "Mykonos", country: "Greece", countryCode: "GR", lat: 37.45, lng: 25.33 },
  { city: "Rhodes", country: "Greece", countryCode: "GR", lat: 36.43, lng: 28.22 },
  { city: "Thessaloniki", country: "Greece", countryCode: "GR", lat: 40.64, lng: 22.94 },
  { city: "Corfu", country: "Greece", countryCode: "GR", lat: 39.62, lng: 19.92 },
  { city: "Zakynthos", country: "Greece", countryCode: "GR", lat: 37.79, lng: 20.90 },
  { city: "Naxos", country: "Greece", countryCode: "GR", lat: 37.10, lng: 25.38 },
  { city: "Meteora", country: "Greece", countryCode: "GR", lat: 39.72, lng: 21.63 },

  // Croatia
  { city: "Dubrovnik", country: "Croatia", countryCode: "HR", lat: 42.65, lng: 18.09 },
  { city: "Split", country: "Croatia", countryCode: "HR", lat: 43.51, lng: 16.44 },
  { city: "Zagreb", country: "Croatia", countryCode: "HR", lat: 45.81, lng: 15.98 },
  { city: "Hvar", country: "Croatia", countryCode: "HR", lat: 43.17, lng: 16.44 },
  { city: "Plitvice Lakes", country: "Croatia", countryCode: "HR", lat: 44.88, lng: 15.62 },
  { city: "Zadar", country: "Croatia", countryCode: "HR", lat: 44.12, lng: 15.23 },
  { city: "Rovinj", country: "Croatia", countryCode: "HR", lat: 45.08, lng: 13.64 },

  // Turkey
  { city: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.01, lng: 28.98, popular: true },
  { city: "Cappadocia", country: "Turkey", countryCode: "TR", lat: 38.64, lng: 34.83 },
  { city: "Antalya", country: "Turkey", countryCode: "TR", lat: 36.90, lng: 30.69 },
  { city: "Bodrum", country: "Turkey", countryCode: "TR", lat: 37.04, lng: 27.43 },
  { city: "Izmir", country: "Turkey", countryCode: "TR", lat: 38.42, lng: 27.14 },
  { city: "Pamukkale", country: "Turkey", countryCode: "TR", lat: 37.92, lng: 29.12 },
  { city: "Fethiye", country: "Turkey", countryCode: "TR", lat: 36.62, lng: 29.12 },
  { city: "Ankara", country: "Turkey", countryCode: "TR", lat: 39.93, lng: 32.86 },
  { city: "Ephesus", country: "Turkey", countryCode: "TR", lat: 37.94, lng: 27.34 },

  // Other Mediterranean
  { city: "Malta", country: "Malta", countryCode: "MT", lat: 35.90, lng: 14.51 },
  { city: "Nicosia", country: "Cyprus", countryCode: "CY", lat: 35.19, lng: 33.38 },
  { city: "Paphos", country: "Cyprus", countryCode: "CY", lat: 34.78, lng: 32.42 },
  { city: "Kotor", country: "Montenegro", countryCode: "ME", lat: 42.42, lng: 18.77 },
  { city: "Budva", country: "Montenegro", countryCode: "ME", lat: 42.29, lng: 18.84 },
  { city: "Tirana", country: "Albania", countryCode: "AL", lat: 41.33, lng: 19.82 },
  { city: "Saranda", country: "Albania", countryCode: "AL", lat: 39.87, lng: 20.00 },
  { city: "Sarajevo", country: "Bosnia and Herzegovina", countryCode: "BA", lat: 43.86, lng: 18.41 },
  { city: "Mostar", country: "Bosnia and Herzegovina", countryCode: "BA", lat: 43.34, lng: 17.81 },
  { city: "Skopje", country: "North Macedonia", countryCode: "MK", lat: 41.99, lng: 21.43 },
  { city: "Ohrid", country: "North Macedonia", countryCode: "MK", lat: 41.12, lng: 20.80 },

  // ══════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ══════════════════════════════════════════════════════════════
  { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.20, lng: 55.27, popular: true },
  { city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", lat: 24.45, lng: 54.65 },
  { city: "Sharjah", country: "United Arab Emirates", countryCode: "AE", lat: 25.35, lng: 55.39 },
  { city: "Tel Aviv", country: "Israel", countryCode: "IL", lat: 32.09, lng: 34.78 },
  { city: "Jerusalem", country: "Israel", countryCode: "IL", lat: 31.77, lng: 35.23 },
  { city: "Eilat", country: "Israel", countryCode: "IL", lat: 29.56, lng: 34.95 },
  { city: "Muscat", country: "Oman", countryCode: "OM", lat: 23.59, lng: 58.54 },
  { city: "Salalah", country: "Oman", countryCode: "OM", lat: 17.02, lng: 54.09 },
  { city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.29, lng: 51.53 },
  { city: "Amman", country: "Jordan", countryCode: "JO", lat: 31.95, lng: 35.93 },
  { city: "Petra", country: "Jordan", countryCode: "JO", lat: 30.33, lng: 35.44 },
  { city: "Aqaba", country: "Jordan", countryCode: "JO", lat: 29.53, lng: 35.01 },
  { city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", lat: 24.71, lng: 46.68 },
  { city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", lat: 21.49, lng: 39.19 },
  { city: "AlUla", country: "Saudi Arabia", countryCode: "SA", lat: 26.62, lng: 37.92 },
  { city: "Bahrain", country: "Bahrain", countryCode: "BH", lat: 26.07, lng: 50.56 },
  { city: "Kuwait City", country: "Kuwait", countryCode: "KW", lat: 29.38, lng: 47.99 },
  { city: "Beirut", country: "Lebanon", countryCode: "LB", lat: 33.89, lng: 35.50 },

  // ══════════════════════════════════════════════════════════════
  // AFRICA
  // ══════════════════════════════════════════════════════════════

  // North Africa
  { city: "Marrakech", country: "Morocco", countryCode: "MA", lat: 31.63, lng: -7.98, popular: true },
  { city: "Fes", country: "Morocco", countryCode: "MA", lat: 34.03, lng: -5.00 },
  { city: "Casablanca", country: "Morocco", countryCode: "MA", lat: 33.57, lng: -7.59 },
  { city: "Chefchaouen", country: "Morocco", countryCode: "MA", lat: 35.17, lng: -5.27 },
  { city: "Tangier", country: "Morocco", countryCode: "MA", lat: 35.77, lng: -5.80 },
  { city: "Essaouira", country: "Morocco", countryCode: "MA", lat: 31.51, lng: -9.77 },
  { city: "Rabat", country: "Morocco", countryCode: "MA", lat: 34.01, lng: -6.83 },
  { city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.04, lng: 31.24 },
  { city: "Luxor", country: "Egypt", countryCode: "EG", lat: 25.69, lng: 32.64 },
  { city: "Sharm El Sheikh", country: "Egypt", countryCode: "EG", lat: 27.98, lng: 34.38 },
  { city: "Aswan", country: "Egypt", countryCode: "EG", lat: 24.09, lng: 32.90 },
  { city: "Alexandria", country: "Egypt", countryCode: "EG", lat: 31.20, lng: 29.92 },
  { city: "Hurghada", country: "Egypt", countryCode: "EG", lat: 27.26, lng: 33.81 },
  { city: "Tunis", country: "Tunisia", countryCode: "TN", lat: 36.81, lng: 10.17 },
  { city: "Sousse", country: "Tunisia", countryCode: "TN", lat: 35.83, lng: 10.59 },
  { city: "Algiers", country: "Algeria", countryCode: "DZ", lat: 36.75, lng: 3.04 },

  // East Africa
  { city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.29, lng: 36.82 },
  { city: "Mombasa", country: "Kenya", countryCode: "KE", lat: -4.04, lng: 39.67 },
  { city: "Diani Beach", country: "Kenya", countryCode: "KE", lat: -4.35, lng: 39.58 },
  { city: "Masai Mara", country: "Kenya", countryCode: "KE", lat: -1.50, lng: 35.14 },
  { city: "Zanzibar", country: "Tanzania", countryCode: "TZ", lat: -6.17, lng: 39.19 },
  { city: "Dar es Salaam", country: "Tanzania", countryCode: "TZ", lat: -6.79, lng: 39.28 },
  { city: "Arusha", country: "Tanzania", countryCode: "TZ", lat: -3.39, lng: 36.68 },
  { city: "Serengeti", country: "Tanzania", countryCode: "TZ", lat: -2.33, lng: 34.83 },
  { city: "Kigali", country: "Rwanda", countryCode: "RW", lat: -1.94, lng: 30.06 },
  { city: "Kampala", country: "Uganda", countryCode: "UG", lat: 0.35, lng: 32.58 },
  { city: "Entebbe", country: "Uganda", countryCode: "UG", lat: 0.05, lng: 32.46 },
  { city: "Addis Ababa", country: "Ethiopia", countryCode: "ET", lat: 9.02, lng: 38.75 },
  { city: "Lalibela", country: "Ethiopia", countryCode: "ET", lat: 12.03, lng: 39.04 },
  { city: "Djibouti", country: "Djibouti", countryCode: "DJ", lat: 11.59, lng: 43.15 },
  { city: "Mogadishu", country: "Somalia", countryCode: "SO", lat: 2.05, lng: 45.32 },

  // Southern Africa
  { city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.92, lng: 18.42, popular: true },
  { city: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.20, lng: 28.05 },
  { city: "Durban", country: "South Africa", countryCode: "ZA", lat: -29.86, lng: 31.02 },
  { city: "Kruger Park", country: "South Africa", countryCode: "ZA", lat: -24.01, lng: 31.49 },
  { city: "Garden Route", country: "South Africa", countryCode: "ZA", lat: -33.96, lng: 22.46 },
  { city: "Stellenbosch", country: "South Africa", countryCode: "ZA", lat: -33.93, lng: 18.86 },
  { city: "Victoria Falls", country: "Zimbabwe", countryCode: "ZW", lat: -17.93, lng: 25.83 },
  { city: "Harare", country: "Zimbabwe", countryCode: "ZW", lat: -17.83, lng: 31.05 },
  { city: "Windhoek", country: "Namibia", countryCode: "NA", lat: -22.56, lng: 17.08 },
  { city: "Sossusvlei", country: "Namibia", countryCode: "NA", lat: -24.73, lng: 15.30 },
  { city: "Swakopmund", country: "Namibia", countryCode: "NA", lat: -22.68, lng: 14.53 },
  { city: "Gaborone", country: "Botswana", countryCode: "BW", lat: -24.66, lng: 25.91 },
  { city: "Okavango Delta", country: "Botswana", countryCode: "BW", lat: -19.50, lng: 22.50 },
  { city: "Maputo", country: "Mozambique", countryCode: "MZ", lat: -25.97, lng: 32.57 },
  { city: "Lusaka", country: "Zambia", countryCode: "ZM", lat: -15.39, lng: 28.32 },
  { city: "Lilongwe", country: "Malawi", countryCode: "MW", lat: -13.96, lng: 33.79 },
  { city: "Antananarivo", country: "Madagascar", countryCode: "MG", lat: -18.88, lng: 47.51 },

  // West Africa
  { city: "Accra", country: "Ghana", countryCode: "GH", lat: 5.56, lng: -0.19 },
  { city: "Cape Coast", country: "Ghana", countryCode: "GH", lat: 5.10, lng: -1.25 },
  { city: "Dakar", country: "Senegal", countryCode: "SN", lat: 14.69, lng: -17.44 },
  { city: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.52, lng: 3.38 },
  { city: "Abuja", country: "Nigeria", countryCode: "NG", lat: 9.06, lng: 7.49 },
  { city: "Abidjan", country: "Ivory Coast", countryCode: "CI", lat: 5.36, lng: -4.01 },
  { city: "Bamako", country: "Mali", countryCode: "ML", lat: 12.65, lng: -8.00 },
  { city: "Freetown", country: "Sierra Leone", countryCode: "SL", lat: 8.48, lng: -13.23 },
  { city: "Lome", country: "Togo", countryCode: "TG", lat: 6.17, lng: 1.23 },
  { city: "Cotonou", country: "Benin", countryCode: "BJ", lat: 6.37, lng: 2.39 },
  { city: "Ouagadougou", country: "Burkina Faso", countryCode: "BF", lat: 12.37, lng: -1.52 },
  { city: "Conakry", country: "Guinea", countryCode: "GN", lat: 9.64, lng: -13.58 },
  { city: "Banjul", country: "Gambia", countryCode: "GM", lat: 13.45, lng: -16.58 },

  // Central Africa
  { city: "Kinshasa", country: "DR Congo", countryCode: "CD", lat: -4.44, lng: 15.27 },
  { city: "Brazzaville", country: "Congo", countryCode: "CG", lat: -4.27, lng: 15.28 },
  { city: "Douala", country: "Cameroon", countryCode: "CM", lat: 4.05, lng: 9.77 },
  { city: "Libreville", country: "Gabon", countryCode: "GA", lat: 0.39, lng: 9.45 },
  { city: "Luanda", country: "Angola", countryCode: "AO", lat: -8.84, lng: 13.23 },

  // Island nations
  { city: "Mauritius", country: "Mauritius", countryCode: "MU", lat: -20.35, lng: 57.55 },
  { city: "Seychelles", country: "Seychelles", countryCode: "SC", lat: -4.68, lng: 55.49 },
  { city: "Reunion", country: "France", countryCode: "RE", lat: -21.12, lng: 55.53 },
  { city: "Zanzibar City", country: "Tanzania", countryCode: "TZ", lat: -6.16, lng: 39.19 },
  { city: "Sao Tome", country: "Sao Tome and Principe", countryCode: "ST", lat: 0.34, lng: 6.73 },
  { city: "Praia", country: "Cape Verde", countryCode: "CV", lat: 14.93, lng: -23.51 },

  // ══════════════════════════════════════════════════════════════
  // NORTH AMERICA
  // ══════════════════════════════════════════════════════════════

  // United States
  { city: "New York", country: "United States", countryCode: "US", lat: 40.71, lng: -74.01, popular: true },
  { city: "Los Angeles", country: "United States", countryCode: "US", lat: 34.05, lng: -118.24 },
  { city: "San Francisco", country: "United States", countryCode: "US", lat: 37.77, lng: -122.42 },
  { city: "Miami", country: "United States", countryCode: "US", lat: 25.76, lng: -80.19 },
  { city: "Chicago", country: "United States", countryCode: "US", lat: 41.88, lng: -87.63 },
  { city: "Honolulu", country: "United States", countryCode: "US", lat: 21.31, lng: -157.86 },
  { city: "Las Vegas", country: "United States", countryCode: "US", lat: 36.17, lng: -115.14 },
  { city: "New Orleans", country: "United States", countryCode: "US", lat: 29.95, lng: -90.07 },
  { city: "Washington D.C.", country: "United States", countryCode: "US", lat: 38.91, lng: -77.04 },
  { city: "Boston", country: "United States", countryCode: "US", lat: 42.36, lng: -71.06 },
  { city: "Seattle", country: "United States", countryCode: "US", lat: 47.61, lng: -122.33 },
  { city: "Austin", country: "United States", countryCode: "US", lat: 30.27, lng: -97.74 },
  { city: "Nashville", country: "United States", countryCode: "US", lat: 36.16, lng: -86.78 },
  { city: "Denver", country: "United States", countryCode: "US", lat: 39.74, lng: -104.99 },
  { city: "Portland", country: "United States", countryCode: "US", lat: 45.52, lng: -122.68 },
  { city: "San Diego", country: "United States", countryCode: "US", lat: 32.72, lng: -117.16 },
  { city: "Savannah", country: "United States", countryCode: "US", lat: 32.08, lng: -81.09 },
  { city: "Philadelphia", country: "United States", countryCode: "US", lat: 39.95, lng: -75.17 },
  { city: "Atlanta", country: "United States", countryCode: "US", lat: 33.75, lng: -84.39 },
  { city: "Dallas", country: "United States", countryCode: "US", lat: 32.78, lng: -96.80 },
  { city: "Houston", country: "United States", countryCode: "US", lat: 29.76, lng: -95.37 },
  { city: "Phoenix", country: "United States", countryCode: "US", lat: 33.45, lng: -112.07 },
  { city: "Orlando", country: "United States", countryCode: "US", lat: 28.54, lng: -81.38 },
  { city: "San Antonio", country: "United States", countryCode: "US", lat: 29.42, lng: -98.49 },
  { city: "Charleston", country: "United States", countryCode: "US", lat: 32.78, lng: -79.93 },
  { city: "Minneapolis", country: "United States", countryCode: "US", lat: 44.98, lng: -93.27 },
  { city: "Salt Lake City", country: "United States", countryCode: "US", lat: 40.76, lng: -111.89 },
  { city: "Key West", country: "United States", countryCode: "US", lat: 24.56, lng: -81.78 },
  { city: "Anchorage", country: "United States", countryCode: "US", lat: 61.22, lng: -149.90 },
  { city: "Maui", country: "United States", countryCode: "US", lat: 20.80, lng: -156.32 },
  { city: "Aspen", country: "United States", countryCode: "US", lat: 39.19, lng: -106.82 },
  { city: "Sedona", country: "United States", countryCode: "US", lat: 34.87, lng: -111.76 },
  { city: "Napa Valley", country: "United States", countryCode: "US", lat: 38.30, lng: -122.29 },
  { city: "Jackson Hole", country: "United States", countryCode: "US", lat: 43.48, lng: -110.76 },
  { city: "Santa Fe", country: "United States", countryCode: "US", lat: 35.69, lng: -105.94 },
  { city: "Detroit", country: "United States", countryCode: "US", lat: 42.33, lng: -83.05 },
  { city: "Pittsburgh", country: "United States", countryCode: "US", lat: 40.44, lng: -80.00 },

  // Canada
  { city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.65, lng: -79.38 },
  { city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.28, lng: -123.12 },
  { city: "Montreal", country: "Canada", countryCode: "CA", lat: 45.50, lng: -73.57 },
  { city: "Quebec City", country: "Canada", countryCode: "CA", lat: 46.81, lng: -71.21 },
  { city: "Banff", country: "Canada", countryCode: "CA", lat: 51.18, lng: -115.57 },
  { city: "Calgary", country: "Canada", countryCode: "CA", lat: 51.05, lng: -114.07 },
  { city: "Ottawa", country: "Canada", countryCode: "CA", lat: 45.42, lng: -75.70 },
  { city: "Victoria", country: "Canada", countryCode: "CA", lat: 48.43, lng: -123.37 },
  { city: "Halifax", country: "Canada", countryCode: "CA", lat: 44.65, lng: -63.57 },
  { city: "Winnipeg", country: "Canada", countryCode: "CA", lat: 49.90, lng: -97.14 },
  { city: "Edmonton", country: "Canada", countryCode: "CA", lat: 53.55, lng: -113.49 },
  { city: "Whistler", country: "Canada", countryCode: "CA", lat: 50.12, lng: -122.95 },
  { city: "Niagara Falls", country: "Canada", countryCode: "CA", lat: 43.09, lng: -79.08 },
  { city: "Jasper", country: "Canada", countryCode: "CA", lat: 52.87, lng: -117.08 },
  { city: "Yellowknife", country: "Canada", countryCode: "CA", lat: 62.45, lng: -114.37 },
  { city: "St. John's", country: "Canada", countryCode: "CA", lat: 47.56, lng: -52.71 },

  // ══════════════════════════════════════════════════════════════
  // MEXICO & CENTRAL AMERICA
  // ══════════════════════════════════════════════════════════════
  { city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.43, lng: -99.13, popular: true },
  { city: "Cancun", country: "Mexico", countryCode: "MX", lat: 21.16, lng: -86.85 },
  { city: "Playa del Carmen", country: "Mexico", countryCode: "MX", lat: 20.63, lng: -87.08 },
  { city: "Oaxaca", country: "Mexico", countryCode: "MX", lat: 17.07, lng: -96.73 },
  { city: "Guadalajara", country: "Mexico", countryCode: "MX", lat: 20.67, lng: -103.35 },
  { city: "Puerto Vallarta", country: "Mexico", countryCode: "MX", lat: 20.65, lng: -105.23 },
  { city: "Tulum", country: "Mexico", countryCode: "MX", lat: 20.21, lng: -87.47 },
  { city: "San Miguel de Allende", country: "Mexico", countryCode: "MX", lat: 20.91, lng: -100.74 },
  { city: "Merida", country: "Mexico", countryCode: "MX", lat: 20.97, lng: -89.59 },
  { city: "Cabo San Lucas", country: "Mexico", countryCode: "MX", lat: 22.89, lng: -109.91 },
  { city: "Monterrey", country: "Mexico", countryCode: "MX", lat: 25.69, lng: -100.32 },
  { city: "Puebla", country: "Mexico", countryCode: "MX", lat: 19.04, lng: -98.20 },
  { city: "Guanajuato", country: "Mexico", countryCode: "MX", lat: 21.02, lng: -101.26 },
  { city: "San Cristobal de las Casas", country: "Mexico", countryCode: "MX", lat: 16.74, lng: -92.64 },
  { city: "Cozumel", country: "Mexico", countryCode: "MX", lat: 20.43, lng: -86.92 },
  { city: "Queretaro", country: "Mexico", countryCode: "MX", lat: 20.59, lng: -100.39 },
  { city: "Havana", country: "Cuba", countryCode: "CU", lat: 23.11, lng: -82.37 },
  { city: "Trinidad", country: "Cuba", countryCode: "CU", lat: 21.80, lng: -79.98 },
  { city: "Vinales", country: "Cuba", countryCode: "CU", lat: 22.62, lng: -83.71 },
  { city: "San Jose", country: "Costa Rica", countryCode: "CR", lat: 9.93, lng: -84.08 },
  { city: "Monteverde", country: "Costa Rica", countryCode: "CR", lat: 10.31, lng: -84.82 },
  { city: "Arenal", country: "Costa Rica", countryCode: "CR", lat: 10.46, lng: -84.70 },
  { city: "Tamarindo", country: "Costa Rica", countryCode: "CR", lat: 10.30, lng: -85.84 },
  { city: "Manuel Antonio", country: "Costa Rica", countryCode: "CR", lat: 9.39, lng: -84.14 },
  { city: "Panama City", country: "Panama", countryCode: "PA", lat: 8.98, lng: -79.52 },
  { city: "Bocas del Toro", country: "Panama", countryCode: "PA", lat: 9.34, lng: -82.24 },
  { city: "Antigua", country: "Guatemala", countryCode: "GT", lat: 14.56, lng: -90.73 },
  { city: "Guatemala City", country: "Guatemala", countryCode: "GT", lat: 14.63, lng: -90.51 },
  { city: "Lake Atitlan", country: "Guatemala", countryCode: "GT", lat: 14.69, lng: -91.20 },
  { city: "Belize City", country: "Belize", countryCode: "BZ", lat: 17.50, lng: -88.20 },
  { city: "San Pedro", country: "Belize", countryCode: "BZ", lat: 17.92, lng: -87.96 },
  { city: "Caye Caulker", country: "Belize", countryCode: "BZ", lat: 17.75, lng: -88.03 },
  { city: "San Salvador", country: "El Salvador", countryCode: "SV", lat: 13.69, lng: -89.19 },
  { city: "Tegucigalpa", country: "Honduras", countryCode: "HN", lat: 14.07, lng: -87.19 },
  { city: "Roatan", country: "Honduras", countryCode: "HN", lat: 16.33, lng: -86.53 },
  { city: "Managua", country: "Nicaragua", countryCode: "NI", lat: 12.15, lng: -86.27 },
  { city: "Granada", country: "Nicaragua", countryCode: "NI", lat: 11.93, lng: -85.96 },
  { city: "San Juan del Sur", country: "Nicaragua", countryCode: "NI", lat: 11.25, lng: -85.87 },

  // ══════════════════════════════════════════════════════════════
  // CARIBBEAN
  // ══════════════════════════════════════════════════════════════
  { city: "Santo Domingo", country: "Dominican Republic", countryCode: "DO", lat: 18.47, lng: -69.94 },
  { city: "Punta Cana", country: "Dominican Republic", countryCode: "DO", lat: 18.58, lng: -68.40 },
  { city: "San Juan", country: "Puerto Rico", countryCode: "PR", lat: 18.47, lng: -66.11 },
  { city: "Kingston", country: "Jamaica", countryCode: "JM", lat: 18.01, lng: -76.79 },
  { city: "Montego Bay", country: "Jamaica", countryCode: "JM", lat: 18.47, lng: -77.92 },
  { city: "Ocho Rios", country: "Jamaica", countryCode: "JM", lat: 18.40, lng: -77.11 },
  { city: "Nassau", country: "Bahamas", countryCode: "BS", lat: 25.05, lng: -77.34 },
  { city: "Bridgetown", country: "Barbados", countryCode: "BB", lat: 13.10, lng: -59.61 },
  { city: "Port of Spain", country: "Trinidad and Tobago", countryCode: "TT", lat: 10.66, lng: -61.51 },
  { city: "Aruba", country: "Aruba", countryCode: "AW", lat: 12.51, lng: -69.97 },
  { city: "Curacao", country: "Curacao", countryCode: "CW", lat: 12.17, lng: -68.98 },
  { city: "Bonaire", country: "Bonaire", countryCode: "BQ", lat: 12.14, lng: -68.26 },
  { city: "St. Lucia", country: "Saint Lucia", countryCode: "LC", lat: 13.91, lng: -60.98 },
  { city: "Antigua", country: "Antigua and Barbuda", countryCode: "AG", lat: 17.12, lng: -61.85 },
  { city: "St. Kitts", country: "Saint Kitts and Nevis", countryCode: "KN", lat: 17.34, lng: -62.77 },
  { city: "Grenada", country: "Grenada", countryCode: "GD", lat: 12.06, lng: -61.75 },
  { city: "Dominica", country: "Dominica", countryCode: "DM", lat: 15.41, lng: -61.37 },
  { city: "St. Maarten", country: "Sint Maarten", countryCode: "SX", lat: 18.04, lng: -63.07 },
  { city: "Turks and Caicos", country: "Turks and Caicos", countryCode: "TC", lat: 21.79, lng: -72.15 },
  { city: "Cayman Islands", country: "Cayman Islands", countryCode: "KY", lat: 19.30, lng: -81.38 },
  { city: "U.S. Virgin Islands", country: "U.S. Virgin Islands", countryCode: "VI", lat: 18.34, lng: -64.93 },
  { city: "Martinique", country: "France", countryCode: "MQ", lat: 14.64, lng: -61.02 },
  { city: "Guadeloupe", country: "France", countryCode: "GP", lat: 16.27, lng: -61.55 },
  { city: "Bermuda", country: "Bermuda", countryCode: "BM", lat: 32.32, lng: -64.76 },

  // ══════════════════════════════════════════════════════════════
  // SOUTH AMERICA
  // ══════════════════════════════════════════════════════════════

  // Colombia
  { city: "Cartagena", country: "Colombia", countryCode: "CO", lat: 10.39, lng: -75.51 },
  { city: "Bogota", country: "Colombia", countryCode: "CO", lat: 4.71, lng: -74.07 },
  { city: "Medellin", country: "Colombia", countryCode: "CO", lat: 6.25, lng: -75.56 },
  { city: "Cali", country: "Colombia", countryCode: "CO", lat: 3.45, lng: -76.53 },
  { city: "Santa Marta", country: "Colombia", countryCode: "CO", lat: 11.24, lng: -74.20 },
  { city: "San Andres", country: "Colombia", countryCode: "CO", lat: 12.58, lng: -81.70 },

  // Peru
  { city: "Lima", country: "Peru", countryCode: "PE", lat: -12.05, lng: -77.04 },
  { city: "Cusco", country: "Peru", countryCode: "PE", lat: -13.53, lng: -71.97 },
  { city: "Arequipa", country: "Peru", countryCode: "PE", lat: -16.41, lng: -71.54 },
  { city: "Machu Picchu", country: "Peru", countryCode: "PE", lat: -13.16, lng: -72.55 },
  { city: "Puno", country: "Peru", countryCode: "PE", lat: -15.84, lng: -70.02 },
  { city: "Iquitos", country: "Peru", countryCode: "PE", lat: -3.75, lng: -73.25 },

  // Argentina
  { city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.60, lng: -58.38, popular: true },
  { city: "Mendoza", country: "Argentina", countryCode: "AR", lat: -32.89, lng: -68.83 },
  { city: "Bariloche", country: "Argentina", countryCode: "AR", lat: -41.13, lng: -71.31 },
  { city: "Ushuaia", country: "Argentina", countryCode: "AR", lat: -54.80, lng: -68.30 },
  { city: "Cordoba", country: "Argentina", countryCode: "AR", lat: -31.42, lng: -64.18 },
  { city: "Salta", country: "Argentina", countryCode: "AR", lat: -24.79, lng: -65.41 },
  { city: "El Calafate", country: "Argentina", countryCode: "AR", lat: -50.34, lng: -72.27 },
  { city: "Iguazu Falls", country: "Argentina", countryCode: "AR", lat: -25.69, lng: -54.44 },

  // Brazil
  { city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.91, lng: -43.17, popular: true },
  { city: "Sao Paulo", country: "Brazil", countryCode: "BR", lat: -23.55, lng: -46.63 },
  { city: "Salvador", country: "Brazil", countryCode: "BR", lat: -12.97, lng: -38.51 },
  { city: "Florianopolis", country: "Brazil", countryCode: "BR", lat: -27.60, lng: -48.55 },
  { city: "Brasilia", country: "Brazil", countryCode: "BR", lat: -15.79, lng: -47.88 },
  { city: "Recife", country: "Brazil", countryCode: "BR", lat: -8.05, lng: -34.87 },
  { city: "Fortaleza", country: "Brazil", countryCode: "BR", lat: -3.72, lng: -38.52 },
  { city: "Manaus", country: "Brazil", countryCode: "BR", lat: -3.12, lng: -60.02 },
  { city: "Belo Horizonte", country: "Brazil", countryCode: "BR", lat: -19.92, lng: -43.94 },
  { city: "Curitiba", country: "Brazil", countryCode: "BR", lat: -25.43, lng: -49.27 },
  { city: "Porto Alegre", country: "Brazil", countryCode: "BR", lat: -30.03, lng: -51.23 },
  { city: "Fernando de Noronha", country: "Brazil", countryCode: "BR", lat: -3.85, lng: -32.42 },
  { city: "Paraty", country: "Brazil", countryCode: "BR", lat: -23.22, lng: -44.72 },
  { city: "Natal", country: "Brazil", countryCode: "BR", lat: -5.79, lng: -35.21 },
  { city: "Foz do Iguacu", country: "Brazil", countryCode: "BR", lat: -25.52, lng: -54.59 },

  // Chile
  { city: "Santiago", country: "Chile", countryCode: "CL", lat: -33.45, lng: -70.67 },
  { city: "Valparaiso", country: "Chile", countryCode: "CL", lat: -33.05, lng: -71.62 },
  { city: "Easter Island", country: "Chile", countryCode: "CL", lat: -27.11, lng: -109.35 },
  { city: "Atacama Desert", country: "Chile", countryCode: "CL", lat: -23.86, lng: -69.13 },
  { city: "Torres del Paine", country: "Chile", countryCode: "CL", lat: -51.25, lng: -72.35 },
  { city: "Punta Arenas", country: "Chile", countryCode: "CL", lat: -53.16, lng: -70.92 },
  { city: "La Serena", country: "Chile", countryCode: "CL", lat: -29.91, lng: -71.25 },

  // Other South America
  { city: "Montevideo", country: "Uruguay", countryCode: "UY", lat: -34.90, lng: -56.16 },
  { city: "Punta del Este", country: "Uruguay", countryCode: "UY", lat: -34.97, lng: -54.95 },
  { city: "Colonia del Sacramento", country: "Uruguay", countryCode: "UY", lat: -34.47, lng: -57.84 },
  { city: "Quito", country: "Ecuador", countryCode: "EC", lat: -0.18, lng: -78.47 },
  { city: "Galapagos Islands", country: "Ecuador", countryCode: "EC", lat: -0.95, lng: -90.97 },
  { city: "Guayaquil", country: "Ecuador", countryCode: "EC", lat: -2.17, lng: -79.92 },
  { city: "Cuenca", country: "Ecuador", countryCode: "EC", lat: -2.90, lng: -79.00 },
  { city: "Banos", country: "Ecuador", countryCode: "EC", lat: -1.40, lng: -78.42 },
  { city: "Caracas", country: "Venezuela", countryCode: "VE", lat: 10.49, lng: -66.88 },
  { city: "Merida", country: "Venezuela", countryCode: "VE", lat: 8.60, lng: -71.14 },
  { city: "Isla Margarita", country: "Venezuela", countryCode: "VE", lat: 11.00, lng: -63.87 },
  { city: "La Paz", country: "Bolivia", countryCode: "BO", lat: -16.50, lng: -68.15 },
  { city: "Sucre", country: "Bolivia", countryCode: "BO", lat: -19.04, lng: -65.26 },
  { city: "Uyuni", country: "Bolivia", countryCode: "BO", lat: -20.46, lng: -66.83 },
  { city: "Asuncion", country: "Paraguay", countryCode: "PY", lat: -25.26, lng: -57.58 },
  { city: "Georgetown", country: "Guyana", countryCode: "GY", lat: 6.80, lng: -58.16 },
  { city: "Paramaribo", country: "Suriname", countryCode: "SR", lat: 5.85, lng: -55.20 },
  { city: "Cayenne", country: "French Guiana", countryCode: "GF", lat: 4.94, lng: -52.33 },

  // ══════════════════════════════════════════════════════════════
  // OCEANIA & PACIFIC
  // ══════════════════════════════════════════════════════════════

  // Australia
  { city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.87, lng: 151.21, popular: true },
  { city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.81, lng: 144.96 },
  { city: "Brisbane", country: "Australia", countryCode: "AU", lat: -27.47, lng: 153.03 },
  { city: "Perth", country: "Australia", countryCode: "AU", lat: -31.95, lng: 115.86 },
  { city: "Gold Coast", country: "Australia", countryCode: "AU", lat: -28.02, lng: 153.43 },
  { city: "Adelaide", country: "Australia", countryCode: "AU", lat: -34.93, lng: 138.60 },
  { city: "Cairns", country: "Australia", countryCode: "AU", lat: -16.92, lng: 145.77 },
  { city: "Hobart", country: "Australia", countryCode: "AU", lat: -42.88, lng: 147.33 },
  { city: "Darwin", country: "Australia", countryCode: "AU", lat: -12.46, lng: 130.84 },
  { city: "Canberra", country: "Australia", countryCode: "AU", lat: -35.28, lng: 149.13 },
  { city: "Alice Springs", country: "Australia", countryCode: "AU", lat: -23.70, lng: 133.88 },
  { city: "Byron Bay", country: "Australia", countryCode: "AU", lat: -28.64, lng: 153.62 },
  { city: "Great Barrier Reef", country: "Australia", countryCode: "AU", lat: -18.29, lng: 147.70 },
  { city: "Uluru", country: "Australia", countryCode: "AU", lat: -25.34, lng: 131.04 },
  { city: "Broome", country: "Australia", countryCode: "AU", lat: -17.96, lng: 122.24 },
  { city: "Whitsundays", country: "Australia", countryCode: "AU", lat: -20.28, lng: 148.95 },

  // New Zealand
  { city: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -36.85, lng: 174.76 },
  { city: "Queenstown", country: "New Zealand", countryCode: "NZ", lat: -45.03, lng: 168.66 },
  { city: "Wellington", country: "New Zealand", countryCode: "NZ", lat: -41.29, lng: 174.78 },
  { city: "Rotorua", country: "New Zealand", countryCode: "NZ", lat: -38.14, lng: 176.25 },
  { city: "Christchurch", country: "New Zealand", countryCode: "NZ", lat: -43.53, lng: 172.64 },
  { city: "Milford Sound", country: "New Zealand", countryCode: "NZ", lat: -44.67, lng: 167.93 },
  { city: "Wanaka", country: "New Zealand", countryCode: "NZ", lat: -44.70, lng: 169.13 },
  { city: "Taupo", country: "New Zealand", countryCode: "NZ", lat: -38.69, lng: 176.08 },
  { city: "Napier", country: "New Zealand", countryCode: "NZ", lat: -39.49, lng: 176.92 },
  { city: "Dunedin", country: "New Zealand", countryCode: "NZ", lat: -45.87, lng: 170.50 },
  { city: "Nelson", country: "New Zealand", countryCode: "NZ", lat: -41.27, lng: 173.28 },

  // Pacific Islands
  { city: "Fiji", country: "Fiji", countryCode: "FJ", lat: -17.77, lng: 177.95 },
  { city: "Tahiti", country: "French Polynesia", countryCode: "PF", lat: -17.53, lng: -149.57 },
  { city: "Bora Bora", country: "French Polynesia", countryCode: "PF", lat: -16.50, lng: -151.74 },
  { city: "Moorea", country: "French Polynesia", countryCode: "PF", lat: -17.54, lng: -149.83 },
  { city: "Noumea", country: "New Caledonia", countryCode: "NC", lat: -22.28, lng: 166.46 },
  { city: "Apia", country: "Samoa", countryCode: "WS", lat: -13.83, lng: -171.76 },
  { city: "Nuku'alofa", country: "Tonga", countryCode: "TO", lat: -21.21, lng: -175.15 },
  { city: "Port Vila", country: "Vanuatu", countryCode: "VU", lat: -17.73, lng: 168.32 },
  { city: "Rarotonga", country: "Cook Islands", countryCode: "CK", lat: -21.24, lng: -159.78 },
  { city: "Palau", country: "Palau", countryCode: "PW", lat: 7.51, lng: 134.58 },
  { city: "Guam", country: "Guam", countryCode: "GU", lat: 13.44, lng: 144.79 },
  { city: "Papua New Guinea", country: "Papua New Guinea", countryCode: "PG", lat: -6.31, lng: 143.96 },
];
