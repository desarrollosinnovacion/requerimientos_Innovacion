import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";
import { alcanceHoja, claseAlcance, formatearPorcentaje, siguienteMes } from "@/lib/indicadores";
import { cargarHojas } from "@/lib/indicadores-datos";
import { ModalPeriodo } from "./modal-periodo";

export default async function IndicadoresPage() {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") redirect("/");

  const hojas = await cargarHojas(supabase);
  const reciente = hojas[0] ?? null;
  const hoy = new Date();
  const propuesto = reciente ? siguienteMes(reciente.orden) : { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Indicadores FDC</h1>
          <p className="mt-1 text-sm text-slate-600">
            Reporte mensual de avance. Cada período es una hoja; ábrela para llenarla.
          </p>
        </div>
        <ModalPeriodo anio={propuesto.anio} mes={propuesto.mes} copiarDe={reciente ? { id: reciente.id, nombre: reciente.nombre } : null} />
      </div>

      {hojas.length === 0 ? (
        <div className="card p-12">
          <p className="text-slate-700">Aún no hay períodos. Crea el primero con el botón «Nuevo período».</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Secciones</th>
                <th className="px-4 py-3">Filas</th>
                <th className="px-4 py-3">Alcance promedio</th>
                <th className="px-4 py-3">Última actualización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hojas.map((h) => {
                const { promedio, filas, conMeta } = alcanceHoja(h);
                return (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/indicadores/${h.id}`} className="font-medium text-brand-600 hover:underline">{h.nombre}</Link>
                      <p className="text-xs text-slate-500">{h.titulo}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{h.secciones.length}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {filas}
                      {conMeta < filas && <span className="text-xs text-slate-500"> ({conMeta} con meta)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium tabular-nums ${claseAlcance(promedio)}`}>
                        {formatearPorcentaje(promedio)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatearFecha(h.actualizado_en, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
