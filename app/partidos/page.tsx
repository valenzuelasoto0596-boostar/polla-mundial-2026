import Link from "next/link";
import { fixtures, GROUP_LETTERS, PHASE_LABELS } from "@/lib/data";
import { getResults } from "@/lib/store";
import { allGroupTables } from "@/lib/groupTables";
import { computeQualifiers } from "@/lib/qualifiers";
import { flag } from "@/lib/flags";
import type { KoPhase } from "@/lib/types";

export const dynamic = "force-dynamic";

const KO_ORDER: KoPhase[] = ["r32", "r16", "qf", "sf", "third", "final"];

function Team({ name }: { name: string | null }) {
  if (!name) return <span style={{ color: "var(--muted)" }}>—</span>;
  return <span><span className="flag">{flag(name)}</span>{name}</span>;
}

export default async function PartidosPage() {
  const results = await getResults();
  const tables = allGroupTables(results);
  const qual = computeQualifiers(results);
  const totalPlayed =
    Object.values(results.groups).filter((s) => s.hg != null && s.ag != null).length;

  return (
    <>
      <h2 className="page-title">Partidos y grupos</h2>
      <p className="page-sub">
        {totalPlayed} partido(s) de grupos cargado(s). Tablas y clasificados calculados en vivo.
      </p>

      {/* Clasificados a dieciseisavos (automático) */}
      <div className="section">
        <h3>Clasificados a Dieciseisavos <span className="tag">automático desde los grupos</span></h3>
        <div className="card" style={{ padding: 14 }}>
          {qual.all.length === 0 ? (
            <span className="pendiente">Se definen a medida que terminan los grupos.</span>
          ) : (
            <>
              <div className="chips" style={{ padding: 0 }}>
                {qual.winners.map((t) => (
                  <span key={t} className="chip hit"><span className="flag">{flag(t)}</span>{t} · 1.º</span>
                ))}
                {qual.runnersUp.map((t) => (
                  <span key={t} className="chip"><span className="flag">{flag(t)}</span>{t} · 2.º</span>
                ))}
                {qual.thirds.map((t) => (
                  <span key={t} className="chip"><span className="flag">{flag(t)}</span>{t} · 3.º</span>
                ))}
              </div>
              {!qual.thirdsReady && (
                <div className="note" style={{ marginTop: 10 }}>
                  Los 8 mejores terceros se definen cuando terminen los 12 grupos.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="legend">
        <span><span className="dot" style={{ background: "rgba(52,211,153,0.6)" }} /> Top 2 del grupo (clasifican directo)</span>
      </div>

      {GROUP_LETTERS.map((L) => {
        const t = tables.find((x) => x.group === L)!;
        return (
          <div className="section" key={L}>
            <h3>Grupo {L} <span className="tag">{t.played}/6 jugados</span></h3>
            <div className="card" style={{ overflowX: "auto" }}>
              <table className="gtable">
                <thead>
                  <tr>
                    <th className="pos"></th>
                    <th className="team-cell">Equipo</th>
                    <th>PJ</th><th>G</th><th>E</th><th>P</th>
                    <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={r.team} className={i < 2 ? "qual" : ""}>
                      <td className="pos">{i + 1}</td>
                      <td className="team-cell"><span className="flag">{flag(r.team)}</span>{r.team}</td>
                      <td>{r.pj}</td><td>{r.g}</td><td>{r.e}</td><td>{r.p}</td>
                      <td>{r.gf}</td><td>{r.gc}</td><td>{r.dg > 0 ? `+${r.dg}` : r.dg}</td>
                      <td className="pts-cell">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {fixtures.groups[L].map((m) => {
                  const sc = results.groups[m.id];
                  const played = sc && sc.hg != null && sc.ag != null;
                  return (
                    <div className="match" key={m.id} style={{ gridTemplateColumns: "1fr auto" }}>
                      <div className="teams">
                        <span className="t"><span className="flag">{flag(m.home)}</span>{m.home}</span>
                        <span className="t" style={{ color: "var(--muted)" }}><span className="flag">{flag(m.away)}</span>{m.away}</span>
                      </div>
                      {played ? (
                        <div className="score actual" style={{ minWidth: 56 }}>{sc.hg}–{sc.ag}</div>
                      ) : (
                        <div className="pendiente">por jugar</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Eliminatorias cargadas */}
      {KO_ORDER.some((ph) => (results.ko[ph] ?? []).length > 0) && (
        <div className="section">
          <h3>Eliminatorias</h3>
          <div className="card">
            {KO_ORDER.map((ph) => {
              const ms = results.ko[ph] ?? [];
              if (ms.length === 0) return null;
              return (
                <div key={ph}>
                  <div className="subhead">{PHASE_LABELS[ph]}</div>
                  {ms.map((m, i) => (
                    <div className="match" key={i} style={{ gridTemplateColumns: "1fr auto" }}>
                      <div className="teams">
                        <span className="t"><span className="flag">{flag(m.home)}</span>{m.home}</span>
                        <span className="t" style={{ color: "var(--muted)" }}><span className="flag">{flag(m.away)}</span>{m.away}</span>
                      </div>
                      <div className="score actual" style={{ minWidth: 56 }}>
                        {m.hg ?? "·"}–{m.ag ?? "·"}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/" className="header-link">← Ver tabla de posiciones</Link>
      </div>
    </>
  );
}
