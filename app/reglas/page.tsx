import Link from "next/link";
import { POINTS } from "@/lib/scoring";

// Página de reglas: se alimenta de las constantes de puntuación (lib/scoring.ts)
// para que nunca se desincronice del cálculo real.
export const dynamic = "force-static";

function Pts({ n }: { n: number }) {
  return <span className="pts win" style={{ display: "inline-block", minWidth: 28 }}>+{n}</span>;
}

export default function ReglasPage() {
  const a = POINTS.advance;
  return (
    <>
      <h2 className="page-title">Reglas y puntaje</h2>
      <p className="page-sub">Así se calculan los puntos de cada participante.</p>

      {/* 1. Fase de grupos */}
      <div className="section">
        <h3>1 · Fase de grupos</h3>
        <div className="card" style={{ padding: 14 }}>
          <p>Por cada uno de los 72 partidos de grupos, según tu marcador pronosticado:</p>
          <ul className="rules-list">
            <li><Pts n={POINTS.exact} /> Marcador <b>exacto</b> (aciertas los goles de ambos equipos).</li>
            <li><Pts n={POINTS.winner} /> Solo el <b>resultado</b> (ganador o empate), sin el marcador exacto.</li>
            <li><span className="pts zero" style={{ minWidth: 28, display: "inline-block" }}>0</span> Si fallas el resultado.</li>
          </ul>
        </div>
      </div>

      {/* 2. Eliminatorias - marcador */}
      <div className="section">
        <h3>2 · Eliminatorias — marcador del cruce</h3>
        <div className="card" style={{ padding: 14 }}>
          <p>
            Igual que en grupos (<b>{POINTS.exact}</b> exacto / <b>{POINTS.winner}</b> resultado),
            <b> pero solo cuenta si acertaste el cruce</b>: que esos dos equipos exactos se
            enfrentaran en esa fase. Si tu llave fue distinta, el marcador no suma.
          </p>
          <p className="note">
            En cruces definidos por penales, el marcador es el de los 90'+prórroga; los penales
            solo definen quién avanza.
          </p>
        </div>
      </div>

      {/* 3. Avance de equipos */}
      <div className="section">
        <h3>3 · Avance de equipos <span className="tag">aunque falles el cruce</span></h3>
        <div className="card" style={{ padding: 14 }}>
          <p>
            Por <b>cada equipo</b> que pronosticaste en una fase y que <b>realmente llegó</b> a
            esa fase. No importa contra quién jugó ni el marcador: es la principal fuente de
            puntos en eliminatorias.
          </p>
          <ul className="rules-list">
            <li><Pts n={a.r32} /> por equipo en <b>Dieciseisavos</b></li>
            <li><Pts n={a.r16} /> por equipo en <b>Octavos</b></li>
            <li><Pts n={a.qf} /> por equipo en <b>Cuartos</b></li>
            <li><Pts n={a.sf} /> por equipo en <b>Semifinal</b></li>
            <li><Pts n={a.final} /> por equipo en la <b>Final</b></li>
          </ul>
          <p className="note">
            Es acumulativo: un equipo que llega lejos suma en cada fase que cruza.
          </p>
        </div>
      </div>

      {/* 4. Cuadro de honor */}
      <div className="section">
        <h3>4 · Cuadro de honor</h3>
        <div className="card" style={{ padding: 14 }}>
          <ul className="rules-list">
            <li><Pts n={POINTS.podium} /> <b>Campeón</b></li>
            <li><Pts n={POINTS.podium} /> <b>Subcampeón</b></li>
            <li><Pts n={POINTS.podium} /> <b>Tercer puesto</b></li>
            <li><Pts n={POINTS.honorExtra} /> Bota de <b>oro / plata / bronce</b> (goleadores), c/u</li>
            <li><Pts n={POINTS.honorExtra} /> Balón de <b>oro / plata / bronce</b> (mejores jugadores), c/u</li>
          </ul>
        </div>
      </div>

      {/* 5. Desempate */}
      <div className="section">
        <h3>5 · Desempate</h3>
        <div className="card" style={{ padding: 14 }}>
          <p>Si dos participantes empatan en puntos, se ordena por:</p>
          <ol className="rules-list">
            <li>Mayor cantidad de <b>marcadores exactos</b> (grupos + eliminatorias).</li>
            <li>Orden alfabético del nombre.</li>
          </ol>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/" className="header-link">← Ver tabla de posiciones</Link>
      </div>
    </>
  );
}
