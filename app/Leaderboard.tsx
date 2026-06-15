"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type Row = {
  id: string;
  name: string;
  total: number;
  group: number;
  koMatch: number;
  advancement: number;
  honor: number;
  champion: string | null;
  championFlag: string;
  move: number | null; // >0 subió, <0 bajó, 0 igual, null sin dato
};

function norm(s: string) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Move({ move }: { move: number | null }) {
  if (move == null) return <span className="mv mv-new">•</span>;
  if (move > 0) return <span className="mv mv-up">▲{move}</span>;
  if (move < 0) return <span className="mv mv-down">▼{-move}</span>;
  return <span className="mv mv-same">—</span>;
}

export default function Leaderboard({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const nq = norm(q);
    return rows.filter((r) => norm(r.name).includes(nq) || norm(r.champion ?? "").includes(nq));
  }, [q, rows]);

  function rankClass(i: number) {
    return i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
  }

  return (
    <>
      <div className="search-wrap">
        <span className="search-ico">🔎</span>
        <input
          className="search"
          placeholder="Buscar participante o su campeón…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="search-clear" onClick={() => setQ("")} aria-label="Limpiar">×</button>
        )}
      </div>

      <div className="board">
        <div className="board-row board-head">
          <div>#</div>
          <div>Participante</div>
          <div style={{ textAlign: "right" }}>Puntos</div>
        </div>
        {filtered.map((s) => {
          const realRank = rows.findIndex((r) => r.id === s.id);
          return (
            <Link key={s.id} href={`/p/${s.id}`} className="board-row">
              <div className="rank-cell">
                <div className={`rank ${rankClass(realRank)}`}>{realRank + 1}</div>
                <Move move={s.move} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="p-name">{s.name}</div>
                <div className="p-meta">
                  <span className="champ-pick" title="Su campeón pronosticado">
                    🏆 <span className="flag">{s.championFlag}</span>{s.champion ?? "—"}
                  </span>
                </div>
                <div className="p-meta dim">
                  G {s.group} · Llaves {s.koMatch} · Avance {s.advancement} · Honor {s.honor}
                </div>
              </div>
              <div className="p-total">
                {s.total}
                <small>pts</small>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="board-row" style={{ color: "var(--muted)" }}>Sin resultados para “{q}”.</div>
        )}
      </div>
    </>
  );
}
