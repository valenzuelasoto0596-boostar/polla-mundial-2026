import { NextResponse } from "next/server";
import { fixtures, GROUP_LETTERS, participants } from "@/lib/data";
import { getResults, saveResults, isStoreConfigured } from "@/lib/store";
import { computeStandings } from "@/lib/scoring";
import type { Results, ActualKoMatch, Score } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IDs de partido de grupo válidos (A1..L6) tomados del fixture.
const VALID_GROUP_IDS = new Set<string>(
  GROUP_LETTERS.flatMap((L) => (fixtures.groups[L] ?? []).map((m) => m.id))
);

const KO_PHASES = ["r32", "r16", "qf", "sf", "third", "final"] as const;
type KoPhase = (typeof KO_PHASES)[number];

function validScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 99;
}

// GET: devuelve los resultados actuales (lectura pública, útil para diagnóstico).
export async function GET() {
  const results = await getResults();
  return NextResponse.json(results);
}

// POST: fusiona marcadores nuevos al Blob sin borrar lo existente.
// Body: { groups?: {ID:{hg,ag}}, ko?: {phase:[{home,away,hg,ag}]}, honor?: {...} }
// Endpoint abierto, igual que /admin (decisión del proyecto: validación grupal).
export async function POST(req: Request) {
  if (!isStoreConfigured()) {
    return NextResponse.json({ ok: false, error: "blob no configurado" }, { status: 500 });
  }

  let body: {
    groups?: Record<string, { hg: unknown; ag: unknown }>;
    ko?: Partial<Record<KoPhase, Array<{ home: unknown; away: unknown; hg: unknown; ag: unknown }>>>;
    honor?: Partial<Results["honor"]>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const prev = await getResults();
  const next: Results = {
    ...prev,
    groups: { ...prev.groups },
    ko: {
      r32: [...prev.ko.r32], r16: [...prev.ko.r16], qf: [...prev.ko.qf],
      sf: [...prev.ko.sf], third: [...prev.ko.third], final: [...prev.ko.final],
    },
    honor: { ...prev.honor },
  };

  const applied: string[] = [];
  const rejected: string[] = [];
  let changes = 0;

  // --- Grupos ---
  for (const [id, sc] of Object.entries(body.groups ?? {})) {
    if (!VALID_GROUP_IDS.has(id) || !validScore(sc?.hg) || !validScore(sc?.ag)) {
      rejected.push(id);
      continue;
    }
    const oriented: Score = { hg: sc.hg as number, ag: sc.ag as number };
    const cur = next.groups[id];
    if (!cur || cur.hg !== oriented.hg || cur.ag !== oriented.ag) {
      next.groups[id] = oriented;
      changes++;
      applied.push(`${id} ${oriented.hg}-${oriented.ag}`);
    }
  }

  // --- Eliminatorias (upsert por par de equipos dentro de la fase) ---
  for (const phase of KO_PHASES) {
    for (const m of body.ko?.[phase] ?? []) {
      const home = typeof m.home === "string" ? m.home.trim() : "";
      const away = typeof m.away === "string" ? m.away.trim() : "";
      if (!home || !away || !validScore(m.hg) || !validScore(m.ag)) {
        rejected.push(`${phase}:${home}-${away}`);
        continue;
      }
      const entry: ActualKoMatch = { home, away, hg: m.hg as number, ag: m.ag as number };
      const arr = next.ko[phase];
      const key = [home, away].sort().join("|");
      const i = arr.findIndex((k) => [k.home, k.away].sort().join("|") === key);
      if (i >= 0) {
        if (arr[i].hg !== entry.hg || arr[i].ag !== entry.ag || arr[i].home !== entry.home) {
          arr[i] = entry; changes++; applied.push(`${phase} ${home} ${entry.hg}-${entry.ag} ${away}`);
        }
      } else {
        arr.push(entry); changes++; applied.push(`${phase} ${home} ${entry.hg}-${entry.ag} ${away}`);
      }
    }
  }

  // --- Cuadro de honor (solo campos enviados) ---
  if (body.honor) {
    for (const [k, v] of Object.entries(body.honor)) {
      if (k in next.honor && (typeof v === "string" || v === null)) {
        (next.honor as Record<string, string | null>)[k] = v;
        changes++;
      }
    }
  }

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
