import Link from "next/link";
import { notFound } from "next/navigation";
import { getParticipant, participants, GROUP_LETTERS, PHASE_LABELS } from "@/lib/data";
import { getResults } from "@/lib/store";
import { computeBreakdown, computeStandings } from "@/lib/scoring";
import { flag } from "@/lib/flags";
import type { KoPhase } from "@/lib/types";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Sc({ v }: { v: [number | null, number | null] | null }) {
  if (!v || (v[0] == null && v[1] == null)) return <div className="score muted">—</div>;
  return <div className="score">{v[0] ?? "·"}–{v[1] ?? "·"}</div>;
}

const KO_ORDER: KoPhase[] = ["r32", "r16", "qf", "sf", "third", "final"];

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = getParticipant(id);
  if (!p) notFound();

  const results = await getResults();
  const b = computeBreakdown(p, results);
  const standings = computeStandings(participants, results);
  const rank = standings.findIndex((s) => s.id === id) + 1;

  const koByPhase = KO_ORDER.map((ph) => ({
    phase: ph,
    label: PHASE_LABELS[ph],
    rows: b.ko.filter((r) => r.phase === ph),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <Link href="/" className="back-link">← Volver a la tabla</Link>

      <div className="profile">
        <div className="avatar">{initials(p.name)}</div>
        <div>
          <h2>{p.name}</h2>
          <div className="rankline">Posición #{rank} de {standings.length}</div>
        </div>
        <div className="big">
          <div className="n">{b.total}</div>
          <div className="l">puntos</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="n">{b.subtotals.group}</div><div className="l">Fase de grupos</div></div>
        <div className="stat"><div className="n">{b.subtotals.koMatch}</div><div className="l">Marcadores llaves</div></div>
        <div className="stat"><div className="n">{b.subtotals.advancement}</div><div className="l">Avance de equipos</div></div>
        <div className="stat"><div className="n">{b.subtotals.honor}</div><div className="l">Cuadro de honor</div></div>
      </div>

      {/* Pronóstico podio */}
      <div className="podium-pred">
        <div className="pp"><span className="pp-l">🥇 Campeón</span><span className="pp-t"><span className="flag">{flag(p.honor.champion)}</span>{p.honor.champion ?? "—"}</span></div>
        <div className="pp"><span className="pp-l">🥈 Subcampeón</span><span className="pp-t"><span className="flag">{flag(p.honor.runnerUp)}</span>{p.honor.runnerUp ?? "—"}</span></div>
        <div className="pp"><span className="pp-l">🥉 Tercero</span><span className="pp-t"><span className="flag">{flag(p.honor.third)}</span>{p.honor.third ?? "—"}</span></div>
      </div>

      {/* Fase de grupos */}
      <div className="section">
        <h3>Fase de grupos <span className="tag">tu marcador vs. real · pts</span></h3>
        <div className="card">
          {GROUP_LETTERS.map((L) => (
            <div key={L}>
              <div className="subhead">Grupo {L}</div>
              <div className="match">
                <div />
                <div className="col-h">Tu marc.</div>
                <div className="col-h">Real</div>
                <div className="col-h">Pts</div>
              </div>
              {b.groups[L].map((m) => (
                <div className="match" key={m.id}>
                  <div className="teams">
                    <span className="t"><span className="flag">{flag(m.home)}</span>{m.home}</span>
                    <span className="t" style={{ color: "var(--muted)" }}><span className="flag">{flag(m.away)}</span>{m.away}</span>
                  </div>
                  <Sc v={m.pred} />
                  <div className={m.actual ? "score actual" : "score muted"}>
                    {m.actual ? `${m.actual[0] ?? "·"}–${m.actual[1] ?? "·"}` : "—"}
                  </div>
                  <div className={`pts ${m.points > 0 ? "win" : "zero"}`}>{m.points > 0 ? `+${m.points}` : "0"}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Eliminatorias */}
      <div className="section">
        <h3>Eliminatorias <span className="tag">marcador solo si aciertas la llave</span></h3>
        <div className="card">
          {koByPhase.map((g) => (
            <div key={g.phase}>
              <div className="subhead">{g.label}</div>
              {g.rows.map((m, i) => (
                <div className="match" key={i}>
                  <div className="teams">
                    <span className="t"><span className="flag">{flag(m.predHome)}</span>{m.predHome ?? "—"}</span>
                    <span className="t" style={{ color: "var(--muted)" }}><span className="flag">{flag(m.predAway)}</span>{m.predAway ?? "—"}</span>
                  </div>
                  <Sc v={m.pred} />
                  <div className={m.actual ? "score actual" : "score muted"}>
                    {m.actual ? `${m.actual[0] ?? "·"}–${m.actual[1] ?? "·"}` : "—"}
                  </div>
                  <div className={`pts ${m.points > 0 ? "win" : "zero"}`}>{m.points > 0 ? `+${m.points}` : "0"}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Avance de equipos */}
      <div className="section">
        <h3>Avance de equipos <span className="tag">aciertos por fase</span></h3>
        <div className="card">
          {b.advancement.map((a) => (
            <div key={a.phase}>
              <div className="subhead">
                {a.phaseLabel} · {a.hits.length} acierto(s) × {a.perTeam} = {a.points} pts
              </div>
              <div className="chips">
                {a.predicted.length === 0 && <span className="note">Sin predicción</span>}
                {a.predicted.map((t) => (
                  <span key={t} className={`chip ${a.hits.includes(t) ? "hit" : ""}`}>
                    <span className="flag">{flag(t)}</span>{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cuadro de honor */}
      <div className="section">
        <h3>Cuadro de honor</h3>
        <div className="card">
          <div className="honor-row">
            <div className="col-h" style={{ textAlign: "left" }}>Categoría</div>
            <div className="col-h" style={{ textAlign: "left" }}>Tu elección</div>
            <div className="col-h" style={{ textAlign: "left" }}>Real</div>
            <div className="col-h">Pts</div>
          </div>
          {b.honor.map((h) => (
            <div className="honor-row" key={h.label}>
              <div className="lbl">{h.label}</div>
              <div className="pick">{h.pick ?? "—"}</div>
              <div className="act">{h.actual ?? "—"}</div>
              <div className={`pts ${h.points > 0 ? "win" : "zero"}`}>{h.points > 0 ? `+${h.points}` : "0"}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
