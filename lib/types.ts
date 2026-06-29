// Tipos compartidos de la Polla Mundial 2026

export type Score = { hg: number | null; ag: number | null };

export type GroupMatchPred = {
  id: string;
  home: string;
  away: string;
  hg: number | null;
  ag: number | null;
};

export type KoMatchPred = {
  home: string | null;
  away: string | null;
  hg: number | null;
  ag: number | null;
};

export type KoPhase = "r32" | "r16" | "qf" | "sf" | "third" | "final";

export type Honor = {
  champion: string | null;
  runnerUp: string | null;
  third: string | null;
  scorerGold: string | null;
  scorerSilver: string | null;
  scorerBronze: string | null;
  ballonGold: string | null;
  ballonSilver: string | null;
  ballonBronze: string | null;
};

export type Participant = {
  id: string;
  name: string;
  file: string;
  groups: Record<string, GroupMatchPred[]>;
  knockout: Record<KoPhase, KoMatchPred[]>;
  honor: Honor;
};

export type FixtureMatch = {
  id: string;
  home: string;
  away: string;
  date: string | null;
  jornada: string | null;
};

export type Fixtures = {
  groups: Record<string, FixtureMatch[]>;
  groupTeams: Record<string, string[]>;
};

// Resultados reales que ingresa el administrador.
export type ActualKoMatch = {
  home: string;
  away: string;
  hg: number | null;
  ag: number | null;
  // Tanda de penales (solo si el cruce terminó empatado y se definió por penales).
  // Sirve para derivar quién avanza; el marcador de los 90'+prórroga sigue en hg/ag.
  pens?: { hg: number; ag: number } | null;
};

export type Results = {
  // Resultados de fase de grupos por id de partido (A1..L6)
  groups: Record<string, Score>;
  // Equipos que clasificaron a Dieciseisavos (32 equipos)
  r32teams: string[];
  // Llaves reales de eliminación con sus marcadores
  ko: {
    r32: ActualKoMatch[];
    r16: ActualKoMatch[];
    qf: ActualKoMatch[];
    sf: ActualKoMatch[];
    third: ActualKoMatch[];
    final: ActualKoMatch[];
  };
  // Cuadro de honor real (goleadores / mejores jugadores)
  honor: {
    scorerGold: string | null;
    scorerSilver: string | null;
    scorerBronze: string | null;
    ballonGold: string | null;
    ballonSilver: string | null;
    ballonBronze: string | null;
  };
  updatedAt: string | null;
  // Orden (ids) de la tabla ANTES de la última actualización (para "subió/bajó")
  prevOrder?: string[];
};

export function emptyResults(): Results {
  return {
    groups: {},
    r32teams: [],
    ko: { r32: [], r16: [], qf: [], sf: [], third: [], final: [] },
    honor: {
      scorerGold: null, scorerSilver: null, scorerBronze: null,
      ballonGold: null, ballonSilver: null, ballonBronze: null,
    },
    updatedAt: null,
  };
}
