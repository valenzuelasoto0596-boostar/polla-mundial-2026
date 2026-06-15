import { put, list } from "@vercel/blob";
import { emptyResults, type Results } from "./types";

const BLOB_KEY = "results.json";

// Lee los resultados reales desde Vercel Blob. Si no hay almacenamiento
// configurado, devuelve resultados vacíos (la app sigue funcionando).
export async function getResults(): Promise<Results> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return emptyResults();
  try {
    const { blobs } = await list({ prefix: BLOB_KEY, token });
    const blob = blobs.find((b) => b.pathname === BLOB_KEY) ?? blobs[0];
    if (!blob) return emptyResults();
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return emptyResults();
    const data = (await res.json()) as Partial<Results>;
    const base = emptyResults();
    return {
      ...base,
      ...data,
      ko: { ...base.ko, ...(data.ko ?? {}) },
      honor: { ...base.honor, ...(data.honor ?? {}) },
    };
  } catch {
    return emptyResults();
  }
}

export async function saveResults(data: Results): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "Almacenamiento no configurado: falta la variable BLOB_READ_WRITE_TOKEN."
    );
  }
  data.updatedAt = new Date().toISOString();
  await put(BLOB_KEY, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
    token,
  });
}

export function isStoreConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
