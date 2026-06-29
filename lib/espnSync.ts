import { fixtures, GROUP_LETTERS } from "./data";
import { espnTeamToEs } from "./teamMap";
import type { MergeBody, KoPhase } from "./merge";

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

// pairKey (normalizado) -> id de partido de grupo del fixture (en español)
function norm(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function pairKey(a: string, b: string): string {
  return [norm(a), norm(b)].sort().join("|");
}
// pairKey -> { id, home } del fixture, para ORIENTAR el marcador al home del fixture
// (la app interpreta groups[id].hg como goles del home del fixture; ESPN podría
// listar local/visitante al revés).
const GROUP_PAIR_TO_FIXTURE: Record<string, { id: string; home: string }> = (() => {
  const out: Record<string, { id: string; home: string }> = {};
  for (const L of GROUP_LETTERS) {
    for (const m of fixtures.groups[L] ?? []) out[pairKey(m.home, m.away)] = { id: m.id, home: m.home };
  }
  return out;
})();

// season.slug de ESPN -> fase de la app ("group" | KoPhase)
function phaseFromSlug(slug: string): KoPhase | "group" | null {
  const s = (slug ?? "").toLowerCase();
  if (s.includes("group")) return "group";
  if (s.includes("round-of-32") || s.includes("round of 32")) return "r32";
  if (s.includes("round-of-16") || s.includes("round of 16")) return "r16";
  if (s.includes("quarter")) return "qf";
  if (s.includes("semi")) return "sf";
  if (s.includes("third") || s.includes("3rd")) return "third";
  if (s.includes("final")) return "final"; // después de semi/third para no confundir
  return null;
}

type EspnCompetitor = {
  homeAway: "home" | "away";
  score?: string | number;
  shootoutScore?: string | number;
  team?: { abbreviation?: string; displayName?: string };
};

async function fetchDay(date: string): Promise<unknown> {
  const res = await fetch(`${ESPN_BASE}?dates=${date}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN ${date} -> ${res.status}`);
  return res.json();
}

// Genera las fechas YYYYMMDD de los últimos `days` días (UTC), incluyendo hoy.
export function recentDates(todayUtc: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(todayUtc.getTime() - i * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${y}${m}${day}`);
  }
  return out;
}

export type EspnSyncSummary = {
  datesChecked: string[];
  finished: number;
  unmapped: string[]; // partidos finalizados que no se pudieron mapear
};

// Construye el MergeBody con TODOS los partidos finalizados de las fechas dadas.
// Es idempotente aguas abajo: applyMerge ignora lo que ya está igual.
export async function buildEspnPayload(
  dates: string[]
): Promise<{ body: MergeBody; summary: EspnSyncSummary }> {
  const body: MergeBody = { groups: {}, ko: {} };
  const unmapped: string[] = [];
  let finished = 0;

  for (const date of dates) {
    let data: { events?: unknown[] };
    try {
      data = (await fetchDay(date)) as { events?: unknown[] };
    } catch {
      continue; // un día falló; seguimos con los demás
    }
    for (const ev of data.events ?? []) {
      const e = ev as {
        season?: { slug?: string };
        competitions?: Array<{
          status?: { type?: { state?: string; completed?: boolean } };
          competitors?: EspnCompetitor[];
        }>;
      };
      const comp = e.competitions?.[0];
      const st = comp?.status?.type;
      if (!comp || st?.state !== "post" || !st?.completed) continue; // solo finalizados
      finished++;

      const home = comp.competitors?.find((c) => c.homeAway === "home");
      const away = comp.competitors?.find((c) => c.homeAway === "away");
      if (!home || !away) continue;

      const hName = espnTeamToEs(home.team?.abbreviation, home.team?.displayName);
      const aName = espnTeamToEs(away.team?.abbreviation, away.team?.displayName);
      const hg = Number(home.score);
      const ag = Number(away.score);
      if (hName == null || aName == null || !Number.isFinite(hg) || !Number.isFinite(ag)) {
        unmapped.push(`${date}:${home.team?.displayName}-${away.team?.displayName}`);
        continue;
      }

      const phase = phaseFromSlug(e.season?.slug ?? "");
      if (phase === "group") {
        const fx = GROUP_PAIR_TO_FIXTURE[pairKey(hName, aName)];
        if (!fx) {
          unmapped.push(`${date}:grupo ${hName}-${aName}`);
          continue;
        }
        // Orientar al home del fixture: si ESPN tiene el local invertido, voltear.
        const sameOrient = norm(hName) === norm(fx.home);
        body.groups![fx.id] = sameOrient ? { hg, ag } : { hg: ag, ag: hg };
      } else if (phase) {
        // penales solo si hubo empate y ESPN trae shootoutScore
        let pens: { hg: number; ag: number } | undefined;
        if (hg === ag && home.shootoutScore != null && away.shootoutScore != null) {
          const ph = Number(home.shootoutScore);
          const pa = Number(away.shootoutScore);
          if (Number.isFinite(ph) && Number.isFinite(pa)) pens = { hg: ph, ag: pa };
        }
        (body.ko![phase] ??= []).push({ home: hName, away: aName, hg, ag, pens });
      } else {
        unmapped.push(`${date}:fase? ${hName}-${aName}`);
      }
    }
  }

  return { body, summary: { datesChecked: dates, finished, unmapped } };
}
