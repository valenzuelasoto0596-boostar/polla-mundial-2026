import { NextResponse } from "next/server";
import { participants } from "@/lib/data";
import { getResults, saveResults, isStoreConfigured } from "@/lib/store";
import { computeStandings } from "@/lib/scoring";
import { applyMerge } from "@/lib/merge";
import { buildEspnPayload, recentDates } from "@/lib/espnSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron determinista: jala los resultados FINALIZADOS del Mundial 2026 desde la
// API pública de ESPN (sin API key) y los fusiona al Blob. Idempotente.
// Lo dispara Vercel Cron (ver vercel.json) y también se puede llamar a mano.
async function run(req: Request) {
  if (!isStoreConfigured()) {
    return NextResponse.json({ ok: false, error: "blob no configurado" }, { status: 500 });
  }
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 3, 1), 14);
  const dry = url.searchParams.get("dry") === "1";

  const dates = recentDates(new Date(), days);
  let payload;
  try {
    payload = await buildEspnPayload(dates);
  } catch (e) {
    return NextResponse.json({ ok: false, error: `ESPN: ${String(e)}` }, { status: 502 });
  }

  const prev = await getResults();
  const { next, changes, applied, rejected } = applyMerge(prev, payload.body);

  if (dry) {
    return NextResponse.json({
      ok: true, dry: true, wouldChange: changes, applied, rejected, source: "espn", ...payload.summary,
    });
  }

  if (changes === 0) {
    return NextResponse.json({
      ok: true, changes: 0, applied, rejected, source: "espn", ...payload.summary,
    });
  }

  next.prevOrder = computeStandings(participants, prev).map((s) => s.id);
  try {
    await saveResults(next);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, changes, applied, rejected, source: "espn", ...payload.summary,
  });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
