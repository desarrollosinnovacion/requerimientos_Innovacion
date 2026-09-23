import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { PRIORIDADES } from "@/lib/formulario";
import { formatearFecha } from "@/lib/formato";
import {
  CLASES_ESTADO_INCIDENCIA,
  ESTADOS_INCIDENCIA,
  esEstadoIncidencia,
  type EstadoIncidencia,
  type IncidenciaFila,
} from "@/lib/incidencias";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgePrioridad, CLASES_PRIORIDAD } from "@/components/badges";
import { SelectorRapido } from "../requerimientos/selector-rapido";
import { MetricasIncidencias } from "./metricas-incidencias";
import { ModalIncidencia } from "./modal-incidencia";
import { asignarIncidencia, cambiarEstadoIncidencia, cambiarPrioridadIncidencia } from "./actions";

const OPCIONES_ESTADO = (Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[]).map((e) => ({
  valor: e,
  etiqueta: ESTADOS_INCIDENCIA[e],
}));

// Responsable con aspecto neutro; "Sin asignar" se señala en Cobre como en los requerimientos.
const CLASES_ASIGNADO: Record<string, string> = { "": "bg-cobre-100 text-cobre-800" };

export default async function IncidenciasPage(props: PageProps<"/incidencias">) {
  const { estado } = await props.searchParams;
  const filtroEstado = esEstadoIncidencia(estado) ? estado : null;
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  // Se traen todas: las métricas se calculan sobre el total y la pestaña filtra en memoria.
  const consulta = supabase
    .from("incidencias")
    .select("*, empresa:empresas(nombre), asignado:perfiles!incidencias_asignado_id_fkey(id, nombre)")
    .order("creado_en", { ascending: false });

  const [{ data, error }, { data: empresasData }, { data: equipoData }] = await Promise.all([
    consulta.returns<IncidenciaFila[]>(),
    supabase.from("empresas").select("id, nombre").eq("activo", true).order("orden").order("nombre"),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);
  const todas = data ?? [];
  const filas = filtroEstado ? todas.filter((i) => i.estado === filtroEstado) : todas;
  const empresas = (empresasData ?? []) as { id: string; nombre: string }[];
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  const pestanas: { valor: EstadoIncidencia | null; etiqueta: string }[] = [
    { valor: null, etiqueta: "Todas" },
    ...OPCIONES_ESTADO.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Incidencias</h1>
          <p className="mt-1 text-sm text-slate-600">
            {esInnovacion
              ? "Tickets menores que llegan al equipo. Cambia estado, prioridad y responsable desde la lista."
              : "Incidencias menores que has reportado al Departamento de Innovación."}
          </p>
        </div>
        <ModalIncidencia empresas={empresas} equipo={esInnovacion ? equipo : null} nombreUsuario={perfil.nombre} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">
          No fue posible cargar las incidencias: {error.message}
        </p>
      )}

      {!error && <MetricasIncidencias incidencias={todas} />}

      <div className="card">
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1 border-b border-slate-200 px-3 pt-3">
          {pestanas.map((p) => {
            const activa = p.valor === filtroEstado;
            return (
              <Link
                key={p.etiqueta}
                href={p.valor ? `/incidencias?estado=${p.valor}` : "/incidencias"}
                aria-current={activa ? "page" : undefined}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  activa ? "border-brand-600 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {p.etiqueta}
              </Link>
            );
          })}
        </nav>

        {filas.length === 0 ? (
          <p className="p-10 text-sm text-slate-600">
            {filtroEstado
              ? `No hay incidencias en "${ESTADOS_INCIDENCIA[filtroEstado]}".`
              : "Aún no hay incidencias registradas. Usa el botón «Registrar incidencia» para crear la primera."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Incidencia</th>
                  <th className="px-4 py-3">Reportó</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((i) => (
                  <tr key={i.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-slate-700">{i.folio}</td>
                    <td className="max-w-md px-4 py-3">
                      <p className="text-slate-800">{i.titulo}</p>
                      {i.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500" title={i.descripcion}>{i.descripcion}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">{i.empresa?.nombre ?? "Sin unidad"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{i.reportado_por ?? "—"}</td>
                    <td className="px-4 py-3">
                      {esInnovacion ? (
                        <SelectorRapido
                          etiqueta={`Responsable de ${i.folio}`}
                          valor={i.asignado?.id ?? ""}
                          opciones={[{ valor: "", etiqueta: "Sin asignar" }, ...equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }))]}
                          clases={CLASES_ASIGNADO}
                          guardar={asignarIncidencia.bind(null, i.id)}
                        />
                      ) : (
                        <span className={i.asignado ? "text-slate-800" : "text-xs text-slate-400"}>{i.asignado?.nombre ?? "Sin asignar"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {esInnovacion ? (
                        <SelectorRapido
                          etiqueta={`Prioridad de ${i.folio}`}
                          valor={i.prioridad ?? ""}
                          opciones={[{ valor: "", etiqueta: "Sin definir" }, ...PRIORIDADES.map((p) => ({ valor: p, etiqueta: p }))]}
                          clases={{ ...CLASES_PRIORIDAD, "": "bg-slate-100 text-slate-500" }}
                          guardar={cambiarPrioridadIncidencia.bind(null, i.id)}
                        />
                      ) : (
                        <BadgePrioridad prioridad={i.prioridad} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {esInnovacion ? (
                        <SelectorRapido
                          etiqueta={`Estado de ${i.folio}`}
                          valor={i.estado}
                          opciones={OPCIONES_ESTADO}
                          clases={CLASES_ESTADO_INCIDENCIA}
                          guardar={cambiarEstadoIncidencia.bind(null, i.id)}
                        />
                      ) : (
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_INCIDENCIA[i.estado]}`}>
                          {ESTADOS_INCIDENCIA[i.estado]}
                        </span>
                      )}
                      {i.estado === "resuelta" && i.resuelta_en && (
                        <p className="mt-0.5 text-xs text-slate-400">{formatearFecha(i.resuelta_en)}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatearFecha(i.creado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
