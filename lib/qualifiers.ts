import { GROUP_LETTERS } from "./data";
import { groupTable, type TeamRow } from "./groupTables";
import type { Results } from "./types";

export type Qualifiers = {
  winners: string[]; // 1.º de cada grupo completo
  runnersUp: string[]; // 2.º de cada grupo completo
  thirds: string[]; // 8 mejores terceros (solo si los 12 grupos están completos)
  all: string[]; // conjunto que clasifica a dieciseisavos
  thirdsReady: boolean; // true cuando ya se pueden definir los mejores terceros
};

// Ordena terceros entre grupos: pts, dg, gf, alfabético
function rankThirds(rows: TeamRow[]): TeamRow[] {
  return [...rows].sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team.localeCompare(b.team)
  );
}

// Calcula los clasificados a dieciseisavos a partir SOLO de los resultados de grupos.
export function computeQualifiers(results: Results): Qualifiers {
  const winners: string[] = [];
  const runnersUp: string[] = [];
  const thirdRows: TeamRow[] = [];
  let completedGroups = 0;

  for (const L of GROUP_LETTERS) {
    const t = groupTable(L, results);
    if (t.played >= 6 && t.rows.length >= 3) {
      completedGroups++;
      winners.push(t.rows[0].team);
      runnersUp.push(t.rows[1].team);
      thirdRows.push(t.rows[2]);
    }
  }

  // Los 8 mejores terceros solo se pueden definir con los 12 grupos terminados.
  const thirdsReady = completedGroups === GROUP_LETTERS.length;
  const thirds = thirdsReady ? rankThirds(thirdRows).slice(0, 8).map((r) => r.team) : [];

  const all = [...winners, ...runnersUp, ...thirds];
  return { winners, runnersUp, thirds, all, thirdsReady };
}
