import { fixtures, GROUP_LETTERS, ALL_TEAMS, PHASE_LABELS } from "@/lib/data";
import { getResults, isStoreConfigured } from "@/lib/store";
import { isAuthed, login, logout, saveResultsAction } from "./actions";
import type { KoPhase } from "@/lib/types";

export const dynamic = "force-dynamic";

const KO_SLOTS: { phase: KoPhase; n: number }[] = [
  { phase: "r32", n: 16 },
  { phase: "r16", n: 8 },
  { phase: "qf", n: 4 },
  { phase: "sf", n: 2 },
  { phase: "third", n: 1 },
  { phase: "final", n: 1 },
];

function TeamSelect({ name, value }: { name: string; value: string | null }) {
  return (
    <select name={name} defaultValue={value ?? ""}>
      <option value="">—</option>
      {ALL_TEAMS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const authed = await isAuthed();
  const pwdConfigured = !!process.env.ADMIN_PASSWORD;

  if (!authed) {
    return (
      <>
        <h2 className="page-title">Ingresar resultados</h2>
        <p className="page-sub">Acceso restringido al administrador de la polla.</p>
        {sp.error && <div className="alert err">Contraseña incorrecta.</div>}
        <div className="card" style={{ padding: 18, maxWidth: 360 }}>
          <form action={login} className="admin-form">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoFocus />
            <div style={{ height: 12 }} />
            <button className="btn full" type="submit">Entrar</button>
          </form>
        </div>
      </>
    );
  }

  const results = await getResults();

  return (
    <>
      <h2 className="page-title">Ingresar resultados</h2>
      <p className="page-sub">
        Carga los marcadores reales. La tabla de posiciones se recalcula al guardar.
      </p>

      {sp.saved && <div className="alert ok">Resultados guardados. La tabla ya está actualizada.</div>}
      {sp.error === "store" && (
        <div className="alert err">
          No se pudo guardar: falta configurar el almacenamiento (variable
          <strong> BLOB_READ_WRITE_TOKEN</strong> en Vercel).
        </div>
      )}
      {!isStoreConfigured() && (
        <div className="banner">
          ⚠️ Aún no hay almacenamiento configurado. Conecta un <strong>Vercel Blob Store</strong> al
          proyecto para poder guardar resultados de forma permanente.
        </div>
      )}
      {!pwdConfigured && (
        <div className="banner">
          🔓 Esta página está abierta. Define la variable <strong>ADMIN_PASSWORD</strong> en Vercel
          para protegerla con contraseña.
        </div>
      )}

      <form action={saveResultsAction} className="admin-form">
        {/* Cuadro de honor */}
        <div className="section">
          <h3>Cuadro de honor</h3>
          <div className="card" style={{ padding: 14 }}>
            <div className="note" style={{ marginBottom: 10 }}>
              Campeón, subcampeón y tercero se calculan automáticamente con la Final y el partido por el
              3.er puesto. Aquí solo escribe goleadores (bota) y mejores jugadores (balón).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div><label>Bota de oro</label><input name="h_scorerGold" defaultValue={results.honor.scorerGold ?? ""} /></div>
              <div><label>Bota de plata</label><input name="h_scorerSilver" defaultValue={results.honor.scorerSilver ?? ""} /></div>
              <div><label>Bota de bronce</label><input name="h_scorerBronze" defaultValue={results.honor.scorerBronze ?? ""} /></div>
              <div><label>Balón de oro</label><input name="h_ballonGold" defaultValue={results.honor.ballonGold ?? ""} /></div>
              <div><label>Balón de plata</label><input name="h_ballonSilver" defaultValue={results.honor.ballonSilver ?? ""} /></div>
              <div><label>Balón de bronce</label><input name="h_ballonBronze" defaultValue={results.honor.ballonBronze ?? ""} /></div>
            </div>
          </div>
        </div>

        {/* Fase de grupos */}
        <div className="section">
          <h3>Fase de grupos <span className="tag">marcador real de cada partido</span></h3>
          <div className="card" style={{ padding: "4px 14px 12px" }}>
            {GROUP_LETTERS.map((L) => (
              <div key={L}>
                <div className="subhead" style={{ margin: "10px -14px", borderRadius: 0 }}>Grupo {L}</div>
                {fixtures.groups[L].map((m) => {
                  const cur = results.groups[m.id];
                  return (
                    <div className="admin-grid" key={m.id}>
                      <div className="tt">{m.home} <span style={{ color: "var(--muted)" }}>vs</span> {m.away}</div>
                      <input type="number" min="0" name={`g_${m.id}_h`} defaultValue={cur?.hg ?? ""} aria-label={`${m.home} goles`} />
                      <input type="number" min="0" name={`g_${m.id}_a`} defaultValue={cur?.ag ?? ""} aria-label={`${m.away} goles`} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Clasificados a dieciseisavos */}
        <div className="section">
          <h3>Clasificados a Dieciseisavos <span className="tag">marca los 32 equipos</span></h3>
          <div className="card" style={{ padding: 14 }}>
            <div className="checkgrid">
              {ALL_TEAMS.map((t) => (
                <label key={t}>
                  <input type="checkbox" name="r32" value={t} defaultChecked={results.r32teams.includes(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Llaves de eliminación */}
        <div className="section">
          <h3>Llaves de eliminación <span className="tag">equipos y marcador real de cada cruce</span></h3>
          <div className="card" style={{ padding: "4px 14px 12px" }}>
            {KO_SLOTS.map(({ phase, n }) => (
              <div key={phase}>
                <div className="subhead" style={{ margin: "10px -14px", borderRadius: 0 }}>{PHASE_LABELS[phase]}</div>
                {Array.from({ length: n }).map((_, i) => {
                  const cur = results.ko[phase]?.[i];
                  return (
                    <div className="admin-grid" key={i} style={{ gridTemplateColumns: "1fr 54px 1fr 54px" }}>
                      <TeamSelect name={`ko_${phase}_${i}_home`} value={cur?.home ?? null} />
                      <input type="number" min="0" name={`ko_${phase}_${i}_hg`} defaultValue={cur?.hg ?? ""} aria-label="goles local" />
                      <TeamSelect name={`ko_${phase}_${i}_away`} value={cur?.away ?? null} />
                      <input type="number" min="0" name={`ko_${phase}_${i}_ag`} defaultValue={cur?.ag ?? ""} aria-label="goles visita" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, position: "sticky", bottom: 16 }}>
          <button className="btn" type="submit">💾 Guardar resultados</button>
        </div>
      </form>

      <form action={logout} style={{ marginTop: 18 }}>
        <button className="btn btn-secondary" type="submit">Cerrar sesión</button>
      </form>
    </>
  );
}
