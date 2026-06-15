import participantsJson from "@/data/participants.json";
import fixturesJson from "@/data/fixtures.json";
import type { Participant, Fixtures } from "./types";

export const participants = participantsJson as unknown as Participant[];
export const fixtures = fixturesJson as unknown as Fixtures;

export const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

// Lista canónica de las 48 selecciones (en orden de grupos)
export const ALL_TEAMS: string[] = (() => {
  const out: string[] = [];
  for (const L of GROUP_LETTERS) {
    for (const t of fixtures.groupTeams[L] ?? []) {
      if (!out.includes(t)) out.push(t);
    }
  }
  return out;
})();

export function getParticipant(id: string): Participant | undefined {
  return participants.find((p) => p.id === id);
}

export const PHASE_LABELS: Record<string, string> = {
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinal",
  third: "Tercer puesto",
  final: "Final",
};
