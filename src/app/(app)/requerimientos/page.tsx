import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { SIN_ASIGNAR, SIN_PRIORIDAD, SIN_UNIDAD } from "@/lib/filtros";
import { ESTADOS, PRIORIDADES, type Estado } from "@/lib/formulario";
import { formatearFecha, tituloProyecto } from "@/lib/formato";
import type { MiembroEquipo, RequerimientoResumen } from "@/lib/tipos";
import { BadgeEstado, BadgePrioridad, CLASES_ESTADO, CLASES_PRIORIDAD } from "@/components/badges";
import { AsignarEquipo } from "./asignar-equipo";
import { FiltrosLista } from "./filtros-lista";
import { SelectorRapido } from "./selector-rapido";
import { cambiarPrioridad } from "./actions";
import { cambiarEstado } from "../proyectos/actions";

const OPCIONES_ESTADO = (Object.keys(ESTADOS) as Estado[]).map((e) => ({ valor: e, etiqueta: ESTADOS[e] }));

type Fila = RequerimientoResumen & { asignados: string[]; unidad: string };
type FilaCruda = RequerimientoResumen & { asignados: { perfil_id: string }[] | null; empresa: { nombre: string } | null };

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function ListaRequerimientos(props: PageProps<"/requerimientos">) {
  const sp = await props.searchParams;
  const eliminado = sp.eliminado;
  const valores = {
    q: texto(sp.q),
    unidad: texto(sp.unidad),
    asignado: texto(sp.asignado),
    prioridad: texto(sp.prioridad),
    estado: texto(sp.estado) in ESTADOS ? texto(sp.estado) : "",
  };
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  // Estado y búsqueda se filtran en la base; unidad, asignado y prioridad se
  // filtran aquí porque dependen de datos derivados (catálogo, equipo, prioridad efectiva).
  let consulta = supabase
    .from("requerimientos")
    .select(
      "id, folio, estado, nombre_proyecto, tipo_requerimiento, prioridad_sugerida, prioridad_final, nombre_solicitante, empresa_area, creado_en, empresa:empresas(nombre), asignados:requerimiento_asignados(perfil_id)",
    )
    .order("creado_en", { ascending: false });

  if (valores.estado) {
    consulta = consulta.eq("estado", valores.estado);
  }
  if (valores.q) {
    const t = `%${valores.q}%`;
    consulta = consulta.or(
      `folio.ilike.${t},nombre_proyecto.ilike.${t},nombre_solicitante.ilike.${t},empresa_area.ilike.${t},tipo_requerimiento.ilike.${t}`,
    );
  }

  const [{ data, error }, { data: equipoData }, { data: empresasData }] = await Promise.all([
    consulta.returns<FilaCruda[]>(),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
    supabase.from("empresas").select("nombre").eq("activo", true).order("orden").order("nombre"),
  ]);
  const todas: Fila[] = (data ?? []).map(({ empresa, ...r }) => ({
    ...r,
    asignados: (r.asignados ?? []).map((a) => a.perfil_id),
    // Igual que el tablero: unidad del catálogo o, en registros antiguos, el primer tramo de "Empresa / Depto / Área".
    unidad: empresa?.nombre ?? r.empresa_area?.split(" / ")[0] ?? SIN_UNIDAD,
  }));
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  const filas = todas.filter((r) => {
    const porUnidad = valores.unidad === "" || r.unidad === valores.unidad;
    const porAsignado =
      valores.asignado === "" ||
      (valores.asignado === SIN_ASIGNAR ? r.asignados.length === 0 : r.asignados.includes(valores.asignado));
    const efectiva = r.prioridad_final ?? r.prioridad_sugerida;
    const porPrioridad =
      valores.prioridad === "" || (valores.prioridad === SIN_PRIORIDAD ? efectiva === null : efectiva === valores.prioridad);
    return porUnidad && porAsignado && porPrioridad;
  });

  // Opciones de unidad: catálogo activo más lo que aparezca en los registros (nombres antiguos o "Sin unidad").
  const unidades = [...new Set([...(empresasData ?? []).map((e) => e.nombre as string), ...todas.map((r) => r.unidad)])].sort(
    (a, b) => (a === SIN_UNIDAD ? 1 : b === SIN_UNIDAD ? -1 : a.localeCompare(b, "es")),
  );
  const hayFiltro = Object.values(valores).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">
            {esInnovacion ? "Todos los requerimientos" : "Mis requerimientos"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {esInnovacion
              ? "Solicitudes recibidas de todas las áreas."
              : "Solicitudes que has enviado al Departamento de Innovación."}
          </p>
        </div>
        <Link href="/requerimientos/nuevo" className="btn-primary">
          + Nuevo requerimiento
        </Link>
      </div>

      {typeof eliminado === "string" && /^REQ-\d{4}-\d{4}$/.test(eliminado) && (
        <p role="status" className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">
          El requerimiento <strong>{eliminado}</strong> fue eliminado.
        </p>
      )}

      <FiltrosLista valores={valores} unidades={unidades} equipo={esInnovacion ? equipo : null} />

      {error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">
          No fue posible cargar los requerimientos: {error.message}
        </p>
      )}

      {filas.length === 0 ? (
        <div className="card p-12">
          <p className="text-slate-700">{hayFiltro ? "Ningún requerimiento coincide con estos filtros." : "No hay requerimientos que mostrar."}</p>
          {hayFiltro ? (
            <Link href="/requerimientos" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Quitar filtros
            </Link>
          ) : (
            <Link href="/requerimientos/nuevo" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Crear el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
            {hayFiltro ? `${filas.length} requerimiento${filas.length === 1 ? "" : "s"} con estos filtros` : `${filas.length} requerimiento${filas.length === 1 ? "" : "s"}`}
          </p>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Proyecto</th>
                {esInnovacion && <th className="px-4 py-3">Solicitante</th>}
                {esInnovacion && <th className="px-4 py-3">Equipo</th>}
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/requerimientos/${r.id}`} className="font-medium text-brand-600 hover:underline">
                      {r.folio}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{tituloProyecto(r)}</p>
                    {r.nombre_proyecto && r.tipo_requerimiento && <p className="text-xs text-slate-500">{r.tipo_requerimiento}</p>}
                  </td>
                  {esInnovacion && (
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{r.nombre_solicitante ?? "Sin nombre"}</p>
                      <p className="text-xs text-slate-500">{r.empresa_area ?? "Sin unidad"}</p>
                    </td>
                  )}
                  {esInnovacion && (
                    <td className="px-4 py-3">
                      <AsignarEquipo id={r.id} equipo={equipo} asignados={r.asignados} />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {esInnovacion ? (
                      <SelectorRapido
                        etiqueta={`Prioridad final de ${r.folio}`}
                        valor={r.prioridad_final ?? ""}
                        opciones={[
                          { valor: "", etiqueta: r.prioridad_sugerida ? `Sugerida: ${r.prioridad_sugerida}` : "Sin definir" },
                          ...PRIORIDADES.map((p) => ({ valor: p, etiqueta: p })),
                        ]}
                        // Sin prioridad final se colorea con la sugerida, igual que la etiqueta.
                        clases={{ ...CLASES_PRIORIDAD, "": r.prioridad_sugerida ? CLASES_PRIORIDAD[r.prioridad_sugerida] : "bg-slate-100 text-slate-500" }}
                        guardar={cambiarPrioridad.bind(null, r.id)}
                      />
                    ) : (
                      <BadgePrioridad prioridad={r.prioridad_final ?? r.prioridad_sugerida} />
                    )}
                    {r.prioridad_final && r.prioridad_final !== r.prioridad_sugerida && (
                      <p className="mt-0.5 text-xs text-slate-400" title="Prioridad sugerida por el solicitante">
                        sug. {r.prioridad_sugerida ?? "sin definir"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {esInnovacion ? (
                      <SelectorRapido
                        etiqueta={`Estado de ${r.folio}`}
                        valor={r.estado}
                        opciones={OPCIONES_ESTADO}
                        clases={CLASES_ESTADO}
                        guardar={cambiarEstado.bind(null, r.id)}
                      />
                    ) : (
                      <BadgeEstado estado={r.estado} />
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatearFecha(r.creado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
