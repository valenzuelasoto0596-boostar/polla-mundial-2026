import Link from "next/link";
import { participants, getParticipant } from "@/lib/data";
import { getResults } from "@/lib/store";
import { computeStandings } from "@/lib/scoring";
import { flag } from "@/lib/flags";
import Leaderboard, { type Row } from "./Leaderboard";

export const metadata = { title: "Tabla de posiciones · Polla Mundial 2026" };

export const dynamic = "force-dynamic";

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const results = await getResults();
  const standings = computeStandings(participants, results);
  const hasResults =
    Object.keys(results.groups).length > 0 || results.ko.r32.length > 0;
  const updated = formatUpdated(results.updatedAt);

  const prevOrder = results.prevOrder ?? null;
  const rows: Row[] = standings.map((s, i) => {
    const p = getParticipant(s.id);
    const champion = p?.honor.champion ?? null;
    let move: number | null = null;
    if (prevOrder) {
      const prevIdx = prevOrder.indexOf(s.id);
      move = prevIdx === -1 ? null : prevIdx - i; // >0 subió posiciones
    }
    return {
      id: s.id,
      name: s.name,
      total: s.total,
      group: s.group,
      koMatch: s.koMatch,
      advancement: s.advancement,
      honor: s.honor,
      champion,
      championFlag: flag(champion),
      move,
    };
  });

  return (
    <>
      <h2 className="page-title">Tabla de posiciones</h2>
      <p className="page-sub">
        {participants.length} participantes · {updated ? `Actualizado ${updated}` : "Sin resultados aún"}
      </p>

      {!hasResults && (
        <div className="banner">
          Todavía no se han ingresado resultados. Cuando se jueguen los partidos,
          ve a <strong>Resultados</strong> para cargarlos y la tabla se actualizará.
        </div>
      )}

      <div className="tabs">
        <Link href="/historial" className="pill">📈 Historial por fecha</Link>
        <Link href="/partidos" className="pill">📋 Ver partidos y grupos</Link>
        <Link href="/admin" className="pill">✏️ Cargar / corregir resultados</Link>
      </div>

      <Leaderboard rows={rows} />
    </>
  );
}
