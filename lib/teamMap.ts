// Mapeo de equipos de ESPN (código FIFA de 3 letras) → nombre en español
// usado en el fixture/predicciones. El tricode es estable y evita líos de acentos.
export const ESPN_TRICODE_TO_ES: Record<string, string> = {
  ALG: "Argelia",
  ARG: "Argentina",
  AUS: "Australia",
  AUT: "Austria",
  BEL: "Bélgica",
  BIH: "Bosnia y Herzegovina",
  BRA: "Brasil",
  CAN: "Canadá",
  CIV: "Costa de Marfil",
  COD: "RD Congo",
  COL: "Colombia",
  CPV: "Cabo Verde",
  CRO: "Croacia",
  CUW: "Curazao",
  CZE: "República Checa",
  ECU: "Ecuador",
  EGY: "Egipto",
  ENG: "Inglaterra",
  ESP: "España",
  FRA: "Francia",
  GER: "Alemania",
  GHA: "Ghana",
  HAI: "Haití",
  IRN: "Irán",
  IRQ: "Irak",
  JOR: "Jordania",
  JPN: "Japón",
  KOR: "Corea del Sur",
  KSA: "Arabia Saudita",
  MAR: "Marruecos",
  MEX: "México",
  NED: "Países Bajos",
  NOR: "Noruega",
  NZL: "Nueva Zelanda",
  PAN: "Panamá",
  PAR: "Paraguay",
  POR: "Portugal",
  QAT: "Catar",
  RSA: "Sudáfrica",
  SCO: "Escocia",
  SEN: "Senegal",
  SUI: "Suiza",
  SWE: "Suecia",
  TUN: "Túnez",
  TUR: "Turquía",
  URU: "Uruguay",
  USA: "Estados Unidos",
  UZB: "Uzbekistán",
};

// Respaldo por nombre en inglés (ESPN displayName) si faltara el tricode.
const ESPN_NAME_TO_ES: Record<string, string> = {
  algeria: "Argelia",
  belgium: "Bélgica",
  "bosnia-herzegovina": "Bosnia y Herzegovina",
  brazil: "Brasil",
  canada: "Canadá",
  "ivory coast": "Costa de Marfil",
  "congo dr": "RD Congo",
  "cape verde": "Cabo Verde",
  croatia: "Croacia",
  "curaçao": "Curazao",
  curacao: "Curazao",
  czechia: "República Checa",
  "czech republic": "República Checa",
  egypt: "Egipto",
  england: "Inglaterra",
  spain: "España",
  france: "Francia",
  germany: "Alemania",
  haiti: "Haití",
  iran: "Irán",
  iraq: "Irak",
  jordan: "Jordania",
  japan: "Japón",
  "south korea": "Corea del Sur",
  "saudi arabia": "Arabia Saudita",
  morocco: "Marruecos",
  mexico: "México",
  netherlands: "Países Bajos",
  norway: "Noruega",
  "new zealand": "Nueva Zelanda",
  panama: "Panamá",
  qatar: "Catar",
  "south africa": "Sudáfrica",
  scotland: "Escocia",
  switzerland: "Suiza",
  sweden: "Suecia",
  tunisia: "Túnez",
  "türkiye": "Turquía",
  turkiye: "Turquía",
  turkey: "Turquía",
  "united states": "Estados Unidos",
  uzbekistan: "Uzbekistán",
};

// Convierte un equipo de ESPN al nombre en español del fixture.
// Devuelve null si no se reconoce (para omitir el partido en lugar de guardar basura).
export function espnTeamToEs(
  tricode: string | null | undefined,
  displayName: string | null | undefined
): string | null {
  if (tricode && ESPN_TRICODE_TO_ES[tricode.toUpperCase()]) {
    return ESPN_TRICODE_TO_ES[tricode.toUpperCase()];
  }
  const key = (displayName ?? "").toLowerCase().trim();
  if (ESPN_NAME_TO_ES[key]) return ESPN_NAME_TO_ES[key];
  // Nombres que coinciden sin traducción (Argentina, Colombia, Ecuador, Ghana, etc.)
  return displayName ?? null;
}
