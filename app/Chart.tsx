"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Series = { id: string; name: string; points: number[] };
type Props = { dates: string[]; labels: string[]; series: Series[] };

const PALETTE = [
  "#2dd4bf", "#38bdf8", "#fbbf24", "#f472b6", "#a78bfa", "#34d399",
  "#fb7185", "#facc15", "#60a5fa", "#f97316", "#4ade80", "#c084fc",
];

const W = 820, H = 380, padL = 38, padR = 16, padT = 16, padB = 46;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

export default function Chart({ labels, series }: Props) {
  const n = labels.length;

  // Ranking actual (último día) para ordenar leyenda y elegir top por defecto
  const ranked = useMemo(() => {
    return [...series]
      .map((s) => ({ ...s, last: s.points[s.points.length - 1] ?? 0 }))
      .sort((a, b) => b.last - a.last);
  }, [series]);

  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    ranked.forEach((s, i) => (m[s.id] = PALETTE[i % PALETTE.length]));
    return m;
  }, [ranked]);

  const [sel, setSel] = useState<Set<string>>(
    () => new Set(ranked.slice(0, 3).map((s) => s.id))
  );

  const maxY = useMemo(() => {
    let m = 0;
    for (const s of series) for (const v of s.points) if (v > m) m = v;
    return Math.max(5, Math.ceil(m / 5) * 5);
  }, [series]);

  const x = (i: number) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / maxY) * plotH;

  const yTicks = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, k) => Math.round((maxY / steps) * k));
  }, [maxY]);

  function path(pts: number[]) {
    return pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  }

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const anySel = sel.size > 0;

  return (
    <>
      <div className="chart-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Evolución de puntos">
          {/* Grid + eje Y */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="ax">{t}</text>
            </g>
          ))}
          {/* Eje X */}
          {labels.map((lb, i) => (
            <text key={i} x={x(i)} y={H - padB + 18} textAnchor="middle" className="ax">{lb}</text>
          ))}

          {/* Líneas no seleccionadas (tenues) */}
          {ranked.map((s) =>
            sel.has(s.id) ? null : (
              <path
                key={s.id}
                d={path(s.points)}
                fill="none"
                stroke="var(--muted)"
                strokeOpacity={anySel ? 0.12 : 0.35}
                strokeWidth={1.2}
              />
            )
          )}
          {/* Líneas seleccionadas (color) */}
          {ranked.map((s) =>
            sel.has(s.id) ? (
              <g key={s.id}>
                <path d={path(s.points)} fill="none" stroke={colorOf[s.id]} strokeWidth={2.6}
                  strokeLinejoin="round" strokeLinecap="round" />
                {s.points.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r={2.8} fill={colorOf[s.id]} />
                ))}
              </g>
            ) : null
          )}
        </svg>
      </div>

      <div className="chart-tools">
        <button className="pill" onClick={() => setSel(new Set(ranked.slice(0, 3).map((s) => s.id)))}>Top 3</button>
        <button className="pill" onClick={() => setSel(new Set(ranked.map((s) => s.id)))}>Todos</button>
        <button className="pill" onClick={() => setSel(new Set())}>Limpiar</button>
      </div>

      <div className="chart-legend">
        {ranked.map((s, i) => (
          <button
            key={s.id}
            className={`leg ${sel.has(s.id) ? "on" : ""}`}
            onClick={() => toggle(s.id)}
            title="Mostrar/ocultar en la gráfica"
          >
            <span className="leg-sw" style={{ background: sel.has(s.id) ? colorOf[s.id] : "var(--border)" }} />
            <span className="leg-pos">{i + 1}</span>
            <span className="leg-name">{s.name}</span>
            <span className="leg-pts">{s.last}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <Link href="/" className="header-link">← Volver a la tabla</Link>
      </div>
    </>
  );
}
