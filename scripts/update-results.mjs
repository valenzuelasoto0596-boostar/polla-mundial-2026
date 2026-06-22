// Fusiona nuevos marcadores de grupo al Vercel Blob sin borrar lo existente.
// Uso: node scripts/update-results.mjs
import { readFileSync } from "node:fs";
import { put, list } from "@vercel/blob";

const env = readFileSync(new URL("../.env.production.local", import.meta.url), "utf8");
const token = env.split("\n").find((l) => l.startsWith("BLOB_READ_WRITE_TOKEN="))
  ?.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
if (!token) throw new Error("No se encontró BLOB_READ_WRITE_TOKEN");

const BLOB_KEY = "results.json";

// Nuevos resultados (orientados al home/away del fixture). Verificados online.
const nuevos = {
  C3: { hg: 0, ag: 1 }, // Escocia 0-1 Marruecos
  C4: { hg: 3, ag: 0 }, // Brasil 3-0 Haití
  D4: { hg: 0, ag: 1 }, // Türkiye 0-1 Paraguay
  E3: { hg: 2, ag: 1 }, // Alemania 2-1 Costa de Marfil
  E4: { hg: 0, ag: 0 }, // Ecuador 0-0 Curazao
  F3: { hg: 5, ag: 1 }, // Países Bajos 5-1 Suecia
  F4: { hg: 0, ag: 4 }, // Túnez 0-4 Japón
  G3: { hg: 0, ag: 0 }, // Bélgica 0-0 Irán
  H3: { hg: 4, ag: 0 }, // España 4-0 Arabia Saudita
  H4: { hg: 2, ag: 2 }, // Uruguay 2-2 Cabo Verde
};

const { blobs } = await list({ prefix: BLOB_KEY, token });
const b = blobs.find((x) => x.pathname === BLOB_KEY);
if (!b) throw new Error("No existe results.json en el Blob");
const prev = await (await fetch(b.url, { cache: "no-store" })).json();

const data = {
  ...prev,
  groups: { ...prev.groups, ...nuevos },
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
console.log("Partidos fusionados:", Object.keys(nuevos).join(", "));
console.log("Total grupos en blob:", Object.keys(data.groups).length);
