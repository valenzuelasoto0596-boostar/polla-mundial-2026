import { fixtures, GROUP_LETTERS } from "./data";
import type { Results } from "./types";

export type TeamRow = {
  team: string;
  pj: number; // partidos jugados
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export type GroupTable = {
  group: string;
  rows: TeamRow[];
  played: number; // partidos jugados del grupo
};

function emptyRow(team: string): TeamRow {
  return { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

export function groupTable(L: string, results: Results): GroupTable {
  const rows = new Map<string, TeamRow>();
  for (const t of fixtures.groupTeams[L] ?? []) rows.set(t, emptyRow(t));

  let played = 0;
  for (const fm of fixtures.groups[L] ?? []) {
    const sc = results.groups[fm.id];
    if (!sc || sc.hg == null || sc.ag == null) continue;
    played++;
    const home = rows.get(fm.home);
    const away = rows.get(fm.away);
    if (!home || !away) continue;
    home.pj++; away.pj++;
    home.gf += sc.hg; home.gc += sc.ag;
    away.gf += sc.ag; away.gc += sc.hg;
    if (sc.hg > sc.ag) { home.g++; home.pts += 3; away.p++; }
    else if (sc.hg < sc.ag) { away.g++; away.pts += 3; home.p++; }
    else { home.e++; away.e++; home.pts++; away.pts++; }
  }

  const out = [...rows.values()];
  for (const r of out) r.dg = r.gf - r.gc;
  out.sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team.localeCompare(b.team)
  );
  return { group: L, rows: out, played };
}

export function allGroupTables(results: Results): GroupTable[] {
  return GROUP_LETTERS.map((L) => groupTable(L, results));
}
