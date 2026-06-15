import { fixtures, GROUP_LETTERS } from "./data";
import { computeBreakdown } from "./scoring";
import { emptyResults, type Participant, type Results, type KoPhase } from "./types";

// Fecha representativa (real, Mundial 2026) del final de cada ronda de eliminación,
// para ubicar esos resultados en la línea de tiempo.
const KO_PHASE_DATE: Record<KoPhase, string> = {
  r32: "2026-07-03",
  r16: "2026-07-07",
  qf: "2026-07-11",
  sf: "2026-07-15",
  third: "2026-07-18",
  final: "2026-07-19",
};
const KO_PHASES: KoPhase[] = ["r32", "r16", "qf", "sf", "third", "final"];

// matchId -> fecha (YYYY-MM-DD) de la fase de grupos
function groupDateMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const L of GROUP_LETTERS) {
    for (const m of fixtures.groups[L] ?? []) {
      if (m.date) map[m.id] = m.date.slice(0, 10);
    }
  }
  return map;
}

function fmtDay(d: string): string {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [, mm, dd] = d.split("-");
  return `${parseInt(dd, 10)} ${meses[parseInt(mm, 10) - 1]}`;
}

export type Series = { id: string; name: string; points: number[] };
export type History = { dates: string[]; labels: string[]; series: Series[] };

// Construye un Results parcial con solo lo jugado hasta la fecha `cutoff` (incluida).
function resultsUpTo(results: Results, cutoff: string, gdate: Record<string, string>): Results {
  const partial = emptyResults();
  for (const [id, sc] of Object.entries(results.groups)) {
    if (sc.hg == null || sc.ag == null) continue;
    const d = gdate[id];
    if (d && d <= cutoff) partial.groups[id] = sc;
  }
  for (const ph of KO_PHASES) {
    if (KO_PHASE_DATE[ph] <= cutoff) partial.ko[ph] = results.ko[ph] ?? [];
  }
  // Bota/balón resuelven al final del torneo
  if (KO_PHASE_DATE.final <= cutoff) partial.honor = results.honor;
  return partial;
}

export function computeHistory(participants: Participant[], results: Results): History {
  const gdate = groupDateMap();

  // Días con al menos un resultado cargado
  const days = new Set<string>();
  for (const [id, sc] of Object.entries(results.groups)) {
    if (sc.hg != null && sc.ag != null && gdate[id]) days.add(gdate[id]);
  }
  for (const ph of KO_PHASES) {
    if ((results.ko[ph] ?? []).length > 0) days.add(KO_PHASE_DATE[ph]);
  }
  const dates = [...days].sort();

  const series: Series[] = participants.map((p) => ({ id: p.id, name: p.name, points: [] }));

  for (const d of dates) {
    const partial = resultsUpTo(results, d, gdate);
    participants.forEach((p, i) => {
      series[i].points.push(computeBreakdown(p, partial).total);
    });
  }

  return { dates, labels: dates.map(fmtDay), series };
}
