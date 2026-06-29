import { NextResponse } from "next/server";
import { participants } from "@/lib/data";
import { getResults, saveResults, isStoreConfigured } from "@/lib/store";
import { computeStandings } from "@/lib/scoring";
import { applyMerge, type MergeBody } from "@/lib/merge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: devuelve los resultados actuales (lectura pública, útil para diagnóstico).
export async function GET() {
  const results = await getResults();
  return NextResponse.json(results);
}

// POST: fusiona marcadores nuevos al Blob sin borrar lo existente.
// Body: { groups?: {ID:{hg,ag}}, ko?: {phase:[{home,away,hg,ag,pens?}]}, honor?: {...} }
// Endpoint abierto, igual que /admin (decisión del proyecto: validación grupal).
export async function POST(req: Request) {
  if (!isStoreConfigured()) {
    return NextResponse.json({ ok: false, error: "blob no configurado" }, { status: 500 });
  }

  let body: MergeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const prev = await getResults();
  const { next, changes, applied, rejected } = applyMerge(prev, body);

  if (changes === 0) {
    return NextResponse.json({ ok: true, changes: 0, applied, rejected });
  }

  // Orden ANTES de esta actualización (para los indicadores ▲▼)
  next.prevOrder = computeStandings(participants, prev).map((s) => s.id);

  try {
    await saveResults(next);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, changes, applied, rejected });
}
