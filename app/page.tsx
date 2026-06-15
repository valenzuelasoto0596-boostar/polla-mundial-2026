import Link from "next/link";
import { participants } from "@/lib/data";
import { getResults } from "@/lib/store";
import { computeStandings } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function rankClass(i: number) {
  return i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
}

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
    Object.keys(results.groups).length > 0 ||
    results.r32teams.length > 0 ||
    results.ko.r32.length > 0;
  const updated = formatUpdated(results.updatedAt);

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

      <div className="board">
        <div className="board-row board-head">
          <div>#</div>
          <div>Participante</div>
          <div style={{ textAlign: "right" }}>Puntos</div>
        </div>
        {standings.map((s, i) => (
          <Link key={s.id} href={`/p/${s.id}`} className="board-row">
            <div className={`rank ${rankClass(i)}`}>{i + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div className="p-name">{s.name}</div>
              <div className="p-meta">
                Grupos {s.group} · Llaves {s.koMatch} · Avance {s.advancement} · Honor {s.honor}
              </div>
            </div>
            <div className="p-total">
              {s.total}
              <small>pts</small>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
