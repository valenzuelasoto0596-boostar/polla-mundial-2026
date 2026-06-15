import type {
  Participant,
  Results,
  KoPhase,
  ActualKoMatch,
} from "./types";
import { fixtures, GROUP_LETTERS, PHASE_LABELS } from "./data";
import { computeQualifiers } from "./qualifiers";

// ---- Reglas de puntuación ----
export const POINTS = {
  exact: 3, // acertar el marcador exacto
  winner: 1, // acertar el ganador
  advance: { r32: 2, r16: 2, qf: 3, sf: 3, final: 4 } as Record<string, number>,
  podium: 5, // campeón / subcampeón / tercero
  honorExtra: 2, // bota y balón (oro/plata/bronce)
};

const PHASES_ADV: KoPhase[] = ["r32", "r16", "qf", "sf", "final"];

// ---- Helpers ----
function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function teamEq(a: string | null, b: string | null): boolean {
  return norm(a) !== "" && norm(a) === norm(b);
}

function sign(a: number, b: number): number {
  return a === b ? 0 : a > b ? 1 : -1;
}

// Puntos de un partido comparando marcador predicho vs real (ya alineados)
function matchPts(
  pH: number | null,
  pA: number | null,
  aH: number | null,
  aA: number | null
): number {
  if (pH == null || pA == null || aH == null || aA == null) return 0;
  if (pH === aH && pA === aA) return POINTS.exact;
  if (sign(pH, pA) === sign(aH, aA)) return POINTS.winner;
  return 0;
}

function winnerOf(m: ActualKoMatch): string | null {
  if (m.hg == null || m.ag == null || m.hg === m.ag) return null;
  return m.hg > m.ag ? m.home : m.away;
}
function loserOf(m: ActualKoMatch): string | null {
  if (m.hg == null || m.ag == null || m.hg === m.ag) return null;
  return m.hg > m.ag ? m.away : m.home;
}

// Equipos que avanzaron a cada fase (derivados AUTOMÁTICAMENTE de los resultados)
export function actualAdvanced(results: Results): Record<string, string[]> {
  // R32: 1.º y 2.º de cada grupo + mejores terceros, calculado desde los grupos.
  const r32 = computeQualifiers(results).all;
  const r16 = (results.ko.r32 ?? []).map(winnerOf).filter(Boolean) as string[];
  const qf = (results.ko.r16 ?? []).map(winnerOf).filter(Boolean) as string[];
  const sf = (results.ko.qf ?? []).map(winnerOf).filter(Boolean) as string[];
  const final = (results.ko.sf ?? []).map(winnerOf).filter(Boolean) as string[];
  return { r32, r16, qf, sf, final };
}

export function actualPodium(results: Results) {
  const f = results.ko.final?.[0];
  const t = results.ko.third?.[0];
  return {
    champion: f ? winnerOf(f) : null,
    runnerUp: f ? loserOf(f) : null,
    third: t ? winnerOf(t) : null,
  };
}

// Equipos que un participante predijo en una fase de eliminación
function predTeamsInPhase(p: Participant, phase: KoPhase): string[] {
  const out: string[] = [];
  for (const m of p.knockout[phase] ?? []) {
    for (const t of [m.home, m.away]) {
      if (t && !out.some((x) => teamEq(x, t))) out.push(t);
    }
  }
  return out;
}

// ---- Estructuras de salida ----
export type GroupMatchRow = {
  id: string;
  home: string;
  away: string;
  pred: [number | null, number | null];
  actual: [number | null, number | null] | null;
  points: number;
};

export type KoMatchRow = {
  phase: KoPhase;
  phaseLabel: string;
  predHome: string | null;
  predAway: string | null;
  pred: [number | null, number | null];
  actual: [number | null, number | null] | null;
  matched: boolean;
  points: number;
};

export type AdvRow = {
  phase: string;
  phaseLabel: string;
  predicted: string[];
  hits: string[];
  perTeam: number;
  points: number;
};

export type HonorRow = {
  label: string;
  pick: string | null;
  actual: string | null;
  points: number;
  hit: boolean;
};

export type Breakdown = {
  total: number;
  subtotals: {
    group: number;
    koMatch: number;
    advancement: number;
    honor: number;
  };
  groups: Record<string, GroupMatchRow[]>;
  ko: KoMatchRow[];
  advancement: AdvRow[];
  honor: HonorRow[];
};

// ---- Cálculo principal ----
export function computeBreakdown(p: Participant, results: Results): Breakdown {
  const groups: Record<string, GroupMatchRow[]> = {};
  let groupPts = 0;

  for (const L of GROUP_LETTERS) {
    const rows: GroupMatchRow[] = [];
    const preds = p.groups[L] ?? [];
    for (const fm of fixtures.groups[L] ?? []) {
      const pred = preds.find((x) => x.id === fm.id);
      const act = results.groups[fm.id];
      const aH = act?.hg ?? null;
      const aA = act?.ag ?? null;
      const pH = pred?.hg ?? null;
      const pA = pred?.ag ?? null;
      const pts = matchPts(pH, pA, aH, aA);
      groupPts += pts;
      rows.push({
        id: fm.id,
        home: fm.home,
        away: fm.away,
        pred: [pH, pA],
        actual: aH == null && aA == null ? null : [aH, aA],
        points: pts,
      });
    }
    groups[L] = rows;
  }

  // Partidos de eliminación (puntos por marcador si coincide la llave)
  const koRows: KoMatchRow[] = [];
  let koPts = 0;
  const phases: KoPhase[] = ["r32", "r16", "qf", "sf", "third", "final"];
  for (const phase of phases) {
    const actualMatches = [...(results.ko[phase] ?? [])];
    const used = new Array(actualMatches.length).fill(false);
    for (const pm of p.knockout[phase] ?? []) {
      if (!pm.home && !pm.away) continue;
      // Buscar partido real con el mismo par de equipos
      let matchedIdx = -1;
      for (let i = 0; i < actualMatches.length; i++) {
        if (used[i]) continue;
        const am = actualMatches[i];
        const same =
          (teamEq(pm.home, am.home) && teamEq(pm.away, am.away)) ||
          (teamEq(pm.home, am.away) && teamEq(pm.away, am.home));
        if (same) {
          matchedIdx = i;
          break;
        }
      }
      let pts = 0;
      let actual: [number | null, number | null] | null = null;
      let matched = false;
      if (matchedIdx >= 0) {
        const am = actualMatches[matchedIdx];
        used[matchedIdx] = true;
        matched = true;
        // alinear marcador del participante a (am.home, am.away)
        const pForHome = teamEq(pm.home, am.home) ? pm.hg : pm.ag;
        const pForAway = teamEq(pm.home, am.home) ? pm.ag : pm.hg;
        pts = matchPts(pForHome, pForAway, am.hg, am.ag);
        actual = [am.hg, am.ag];
      }
      koPts += pts;
      koRows.push({
        phase,
        phaseLabel: PHASE_LABELS[phase],
        predHome: pm.home,
        predAway: pm.away,
        pred: [pm.hg, pm.ag],
        actual,
        matched,
        points: pts,
      });
    }
  }

  // Avance por fases
  const adv = actualAdvanced(results);
  const advancement: AdvRow[] = [];
  let advPts = 0;
  for (const phase of PHASES_ADV) {
    const predicted = predTeamsInPhase(p, phase);
    const actualSet = adv[phase] ?? [];
    const hits = predicted.filter((t) => actualSet.some((a) => teamEq(a, t)));
    const perTeam = POINTS.advance[phase];
    const pts = hits.length * perTeam;
    advPts += pts;
    advancement.push({
      phase,
      phaseLabel: PHASE_LABELS[phase],
      predicted,
      hits,
      perTeam,
      points: pts,
    });
  }

  // Cuadro de honor
  const podium = actualPodium(results);
  const honor: HonorRow[] = [];
  let honorPts = 0;
  const pushHonor = (label: string, pick: string | null, actual: string | null, value: number) => {
    const hit = teamEq(pick, actual);
    const pts = hit ? value : 0;
    honorPts += pts;
    honor.push({ label, pick, actual, points: pts, hit });
  };
  pushHonor("Campeón", p.honor.champion, podium.champion, POINTS.podium);
  pushHonor("Subcampeón", p.honor.runnerUp, podium.runnerUp, POINTS.podium);
  pushHonor("Tercer puesto", p.honor.third, podium.third, POINTS.podium);
  pushHonor("Bota de oro", p.honor.scorerGold, results.honor.scorerGold, POINTS.honorExtra);
  pushHonor("Bota de plata", p.honor.scorerSilver, results.honor.scorerSilver, POINTS.honorExtra);
  pushHonor("Bota de bronce", p.honor.scorerBronze, results.honor.scorerBronze, POINTS.honorExtra);
  pushHonor("Balón de oro", p.honor.ballonGold, results.honor.ballonGold, POINTS.honorExtra);
  pushHonor("Balón de plata", p.honor.ballonSilver, results.honor.ballonSilver, POINTS.honorExtra);
  pushHonor("Balón de bronce", p.honor.ballonBronze, results.honor.ballonBronze, POINTS.honorExtra);

  const total = groupPts + koPts + advPts + honorPts;
  return {
    total,
    subtotals: { group: groupPts, koMatch: koPts, advancement: advPts, honor: honorPts },
    groups,
    ko: koRows,
    advancement,
    honor,
  };
}

export type Standing = {
  id: string;
  name: string;
  total: number;
  group: number;
  koMatch: number;
  advancement: number;
  honor: number;
  exactHits: number; // # de marcadores exactos (desempate / interés)
};

export function computeStandings(participants: Participant[], results: Results): Standing[] {
  const rows: Standing[] = participants.map((p) => {
    const b = computeBreakdown(p, results);
    let exact = 0;
    for (const L of GROUP_LETTERS) for (const r of b.groups[L]) if (r.points === POINTS.exact) exact++;
    for (const r of b.ko) if (r.points === POINTS.exact) exact++;
    return {
      id: p.id,
      name: p.name,
      total: b.total,
      group: b.subtotals.group,
      koMatch: b.subtotals.koMatch,
      advancement: b.subtotals.advancement,
      honor: b.subtotals.honor,
      exactHits: exact,
    };
  });
  rows.sort((a, b) => b.total - a.total || b.exactHits - a.exactHits || a.name.localeCompare(b.name));
  return rows;
}
