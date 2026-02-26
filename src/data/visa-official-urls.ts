// Official immigration authority URLs — verified as of Feb 2026
// Update when countries launch new visa portals
export const VISA_OFFICIAL_URLS: Record<string, { url: string; label: string }> = {
  // Asia-Pacific
  JP: { url: "https://www.mofa.go.jp/j_info/visit/visa/index.html", label: "Japan MOFA" },
  VN: { url: "https://evisa.xuatnhapcanh.gov.vn", label: "Vietnam Official E-Visa Portal" },
  TH: { url: "https://www.thaievisa.go.th", label: "Thailand e-Visa" },
  KR: { url: "https://www.visa.go.kr", label: "Korea e-Visa" },
  CN: { url: "https://www.visaforchina.cn", label: "China Visa Application Center" },
  ID: { url: "https://molina.imigrasi.go.id", label: "Indonesia Immigration" },
  MY: { url: "https://www.imi.gov.my", label: "Malaysia Immigration" },
  SG: {
    url: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore",
    label: "ICA Singapore",
  },
  PH: { url: "https://eservices.immigration.gov.ph", label: "Philippines Bureau of Immigration" },
  KH: { url: "https://www.evisa.gov.kh", label: "Cambodia e-Visa" },
  LA: { url: "https://laoevisa.gov.la", label: "Laos e-Visa" },
  MM: { url: "https://evisa.moip.gov.mm", label: "Myanmar e-Visa" },
  TW: { url: "https://visawebapp.boca.gov.tw", label: "Taiwan Bureau of Consular Affairs" },
  AU: { url: "https://immi.homeaffairs.gov.au/visas", label: "Australia Home Affairs" },
  NZ: { url: "https://www.immigration.govt.nz/new-zealand-visas", label: "NZ Immigration" },
  IN: { url: "https://indianvisaonline.gov.in/evisa/tvoa.html", label: "India e-Visa" },
  LK: { url: "https://eta.gov.lk", label: "Sri Lanka ETA" },
  NP: { url: "https://online.nepalimmigration.gov.np", label: "Nepal Immigration" },
  // Middle East
  AE: {
    url: "https://u.ae/en/information-and-services/visa-and-emirates-id/do-you-need-an-entry-permit-or-a-visa-to-enter-the-uae",
    label: "UAE Government",
  },
  QA: {
    url: "https://portal.moi.gov.qa/wps/portal/MOIInternet/services/inquiries/visainquiry",
    label: "Qatar MOI",
  },
  OM: { url: "https://evisa.rop.gov.om", label: "Oman Royal Police e-Visa" },
  SA: { url: "https://visa.visitsaudi.com", label: "Saudi Arabia e-Visa" },
  TR: { url: "https://www.evisa.gov.tr", label: "Turkey e-Visa" },
  JO: { url: "https://www.timatic.iata.org", label: "Jordan Visa Info" },
  IL: {
    url: "https://www.gov.il/en/departments/ministry_of_interior",
    label: "Israel Interior Ministry",
  },
  // Europe (Schengen + others)
  DE: { url: "https://www.auswaertiges-amt.de/en/visa-service", label: "German Foreign Office" },
  FR: { url: "https://france-visas.gouv.fr", label: "France-Visas" },
  GB: { url: "https://www.gov.uk/check-uk-visa", label: "UK Visa Check" },
  IT: { url: "https://vistoperitalia.esteri.it/home/en", label: "Italy Visa Portal" },
  ES: {
    url: "https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Visados.aspx",
    label: "Spain Foreign Ministry",
  },
  PT: { url: "https://vistos.mne.gov.pt/en/", label: "Portugal e-Visa" },
  GR: { url: "https://www.mfa.gr/en/visas/", label: "Greece MFA" },
  NL: {
    url: "https://www.netherlandsworldwide.nl/visa-the-netherlands",
    label: "Netherlands Worldwide",
  },
  // Africa
  EG: { url: "https://visa2egypt.gov.eg", label: "Egypt e-Visa" },
  MA: { url: "https://www.moroccanvisa.com", label: "Morocco Visa Info" },
  KE: { url: "https://evisa.go.ke", label: "Kenya e-Visa" },
  TZ: { url: "https://eservices.immigration.go.tz", label: "Tanzania Immigration" },
  ZA: { url: "https://www.dha.gov.za/index.php/applying-for-sa-visa", label: "South Africa DHA" },
  ET: { url: "https://www.evisa.gov.et", label: "Ethiopia e-Visa" },
  RW: { url: "https://irembo.gov.rw/rolportal/en/web/iga/single-visa", label: "Rwanda e-Visa" },
  // Americas
  US: { url: "https://travel.state.gov/content/travel/en/us-visas.html", label: "US State Dept" },
  CA: {
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html",
    label: "IRCC Canada",
  },
  MX: { url: "https://consulmex.sre.gob.mx/reinounido/index.php/visas", label: "Mexico SRE" },
  BR: { url: "https://formulario.itamaraty.gov.br/en-us/", label: "Brazil e-Visa" },
  AR: { url: "https://cancilleria.gob.ar/en/services/visas", label: "Argentina MFA" },
  CL: { url: "https://tramites.extranjeria.gob.cl", label: "Chile Immigration" },
  CO: { url: "https://visascolombia.cancilleria.gov.co", label: "Colombia e-Visa" },
  PE: { url: "https://www.migraciones.gob.pe/", label: "Peru Migrations" },
  CU: { url: "https://misiones.minrex.gob.cu/en/cuba-tourist-card", label: "Cuba Tourist Card" },
};
