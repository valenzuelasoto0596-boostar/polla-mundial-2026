// Carga los resultados reales del Mundial 2026 (hasta 15 jun) al Vercel Blob.
import { readFileSync } from "node:fs";
import { put, list } from "@vercel/blob";

// Cargar token desde .env.production.local
const env = readFileSync(new URL("../.env.production.local", import.meta.url), "utf8");
const token = env.split("\n").find((l) => l.startsWith("BLOB_READ_WRITE_TOKEN="))
  ?.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
if (!token) throw new Error("No se encontró BLOB_READ_WRITE_TOKEN");

const BLOB_KEY = "results.json";

// Resultados de la Jornada 1 (orientados al home/away del fixture del Excel)
const groups = {
  // Grupo A
  A1: { hg: 2, ag: 0 }, // México 2-0 Sudáfrica
  A2: { hg: 2, ag: 1 }, // Corea del Sur 2-1 República Checa
  // Grupo B
  B1: { hg: 1, ag: 1 }, // Canadá 1-1 Bosnia
  B2: { hg: 1, ag: 1 }, // Catar 1-1 Suiza
  // Grupo C
  C1: { hg: 1, ag: 1 }, // Brasil 1-1 Marruecos
  C2: { hg: 0, ag: 1 }, // Haití 0-1 Escocia
  // Grupo D
  D1: { hg: 4, ag: 1 }, // Estados Unidos 4-1 Paraguay
  D2: { hg: 2, ag: 0 }, // Australia 2-0 Turquía
  // Grupo E
  E1: { hg: 7, ag: 1 }, // Alemania 7-1 Curazao
  E2: { hg: 1, ag: 0 }, // Costa de Marfil 1-0 Ecuador
  // Grupo F
  F1: { hg: 2, ag: 2 }, // Países Bajos 2-2 Japón
  F2: { hg: 5, ag: 1 }, // Suecia 5-1 Túnez
  // Grupo G
  G1: { hg: 1, ag: 1 }, // Bélgica 1-1 Egipto
  // Grupo H
  H1: { hg: 0, ag: 0 }, // España 0-0 Cabo Verde
};

// Preservar lo que ya hubiera guardado (no debería haber nada)
let prev = null;
try {
  const { blobs } = await list({ prefix: BLOB_KEY, token });
  const b = blobs.find((x) => x.pathname === BLOB_KEY);
  if (b) prev = await (await fetch(b.url, { cache: "no-store" })).json();
} catch {}

const data = {
  groups,
  r32teams: prev?.r32teams ?? [],
  ko: prev?.ko ?? { r32: [], r16: [], qf: [], sf: [], third: [], final: [] },
  honor: prev?.honor ?? {
    scorerGold: null, scorerSilver: null, scorerBronze: null,
    ballonGold: null, ballonSilver: null, ballonBronze: null,
  },
  updatedAt: new Date().toISOString(),
};

const res = await put(BLOB_KEY, JSON.stringify(data), {
  access: "public",
  contentType: "application/json",
  allowOverwrite: true,
  addRandomSuffix: false,
  token,
});
console.log("Guardado:", res.url);
console.log("Partidos cargados:", Object.keys(groups).length);
