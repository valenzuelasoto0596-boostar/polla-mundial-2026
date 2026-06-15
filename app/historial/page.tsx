import Link from "next/link";
import { participants } from "@/lib/data";
import { getResults } from "@/lib/store";
import { computeHistory } from "@/lib/history";
import Chart from "../Chart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historial · Polla Mundial 2026" };

export default async function HistorialPage() {
  const results = await getResults();
  const history = computeHistory(participants, results);

  return (
    <>
      <h2 className="page-title">Historial de puntos</h2>
      <p className="page-sub">
        Puntos acumulados por día de partido. Toca un nombre para mostrar/ocultar su línea.
      </p>

      {history.dates.length === 0 ? (
        <div className="banner">
          Aún no hay días con resultados. Cuando se carguen marcadores, aquí verás la evolución de cada
          participante. Ve a <Link href="/admin"><strong>Resultados</strong></Link>.
        </div>
      ) : (
        <Chart dates={history.dates} labels={history.labels} series={history.series} />
      )}
    </>
  );
}
