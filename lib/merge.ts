import { fixtures, GROUP_LETTERS } from "./data";
import type { Results, ActualKoMatch, Score } from "./types";

// IDs de partido de grupo válidos (A1..L6) tomados del fixture.
const VALID_GROUP_IDS = new Set<string>(
  GROUP_LETTERS.flatMap((L) => (fixtures.groups[L] ?? []).map((m) => m.id))
);

export const KO_PHASES = ["r32", "r16", "qf", "sf", "third", "final"] as const;
export type KoPhase = (typeof KO_PHASES)[number];

export type MergeBody = {
  groups?: Record<string, { hg: unknown; ag: unknown }>;
  ko?: Partial<
    Record<
      KoPhase,
      Array<{ home: unknown; away: unknown; hg: unknown; ag: unknown; pens?: unknown }>
    >
  >;
  honor?: Partial<Results["honor"]>;
};

export function validScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 99;
}

function parsePens(v: unknown): { hg: number; ag: number } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { hg?: unknown; ag?: unknown };
  if (validScore(o.hg) && validScore(o.ag)) return { hg: o.hg as number, ag: o.ag as number };
  return null;
}

function pensEq(a: { hg: number; ag: number } | null | undefined, b: { hg: number; ag: number } | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.hg === b.hg && a.ag === b.ag;
}

// Fusiona marcadores nuevos sobre `prev` SIN borrar lo existente.
// Idempotente: solo reporta cambios reales. No persiste (eso lo hace quien llama).
export function applyMerge(
  prev: Results,
  body: MergeBody
): { next: Results; changes: number; applied: string[]; rejected: string[] } {
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
      const pens = parsePens(m.pens);
      const entry: ActualKoMatch = { home, away, hg: m.hg as number, ag: m.ag as number, pens };
      const arr = next.ko[phase];
      const key = [home, away].sort().join("|");
      const i = arr.findIndex((k) => [k.home, k.away].sort().join("|") === key);
      const pensLabel = pens ? ` (pen ${pens.hg}-${pens.ag})` : "";
      if (i >= 0) {
        const c = arr[i];
        if (c.hg !== entry.hg || c.ag !== entry.ag || c.home !== entry.home || !pensEq(c.pens, pens)) {
          arr[i] = entry; changes++; applied.push(`${phase} ${home} ${entry.hg}-${entry.ag} ${away}${pensLabel}`);
        }
      } else {
        arr.push(entry); changes++; applied.push(`${phase} ${home} ${entry.hg}-${entry.ag} ${away}${pensLabel}`);
      }
    }
  }

  // --- Cuadro de honor (solo campos enviados) ---
  if (body.honor) {
    for (const [k, v] of Object.entries(body.honor)) {
      if (k in next.honor && (typeof v === "string" || v === null)) {
        if ((next.honor as Record<string, string | null>)[k] !== v) {
          (next.honor as Record<string, string | null>)[k] = v;
          changes++;
        }
      }
    }
  }

  return { next, changes, applied, rejected };
}
