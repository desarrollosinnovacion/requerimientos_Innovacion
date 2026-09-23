import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { ESTADOS, PRIORIDADES, type Estado } from "@/lib/formulario";
import { formatearFecha, tituloProyecto } from "@/lib/formato";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgeEstado, BadgePrioridad } from "@/components/badges";
import { BotonLinkPublico } from "@/components/boton-link-publico";
import { Dona, type SegmentoDona } from "@/components/dona";
import {
  COLOR_ESTADO as COLOR_BARRA,
  COLOR_CATEGORIA as COLOR_EQUIPO,
  COLOR_OTROS,
  COLOR_PRIORIDAD,
  COLOR_SIN_ASIGNAR,
  MAX_SEGMENTOS_DONA as MAX_MIEMBROS_DONA,
  ORDEN_ESTADOS,
} from "@/lib/colores-estado";

type Fila = {
  id: string;
  folio: string;
  estado: Estado;
  nombre_proyecto: string | null;
  tipo_requerimiento: string | null;
  prioridad_sugerida: string | null;
  prioridad_final: string | null;
  nombre_solicitante: string | null;
  empresa_area: string | null;
  /** Unidad de negocio (catálogo `empresas`); null en registros antiguos sin empresa_id. */
  empresa: { nombre: string } | null;
  fecha_limite: string | null;
  fecha_estimada_entrega: string | null;
  creado_en: string;
  actualizado_en: string;
  asignados: MiembroEquipo[];
};

type FilaCruda = Omit<Fila, "asignados" | "empresa"> & { asignados: { perfil: unknown }[] | null; empresa: unknown };


/** Estados con tarjeta propia en la fila de indicadores; el resto solo aparece en la dona. */
const ESTADOS_INDICADOR: Estado[] = ["recurrente", "en_desarrollo", "en_pruebas", "entregado"];
/** Etiqueta para agrupar registros sin prioridad o sin unidad. */
const SIN_DATO = "Sin definir";


export default async function Inicio() {
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const [{ data: crudas }, { data: equipoData }] = await Promise.all([
    supabase
      .from("requerimientos")
      .select(
        "id, folio, estado, nombre_proyecto, tipo_requerimiento, prioridad_sugerida, prioridad_final, nombre_solicitante, empresa_area, empresa:empresas(nombre), fecha_limite, fecha_estimada_entrega, creado_en, actualizado_en, asignados:requerimiento_asignados(perfil:perfiles(id, nombre))",
      )
      .order("creado_en", { ascending: false })
      .returns<FilaCruda[]>(),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);

  const filas: Fila[] = (crudas ?? []).map((r) => ({
    ...r,
    empresa: (r.empresa as { nombre: string } | null) ?? null,
    asignados: (r.asignados ?? [])
      .map((a) => a.perfil as MiembroEquipo | null)
      .filter((p): p is MiembroEquipo => p !== null),
  }));
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  const hoy = inicioDelDia(new Date());
  // Activo = todo lo que aún no se entregó (incluye pausados y recurrentes).
  const activos = filas.filter((r) => r.estado !== "entregado");
  const porEstado = contar(filas, (r) => r.estado);
  const porPrioridad = contar(activos, (r) => r.prioridad_final ?? r.prioridad_sugerida ?? SIN_DATO);
  const porArea = contar(activos, (r) => r.empresa_area ?? SIN_DATO);
  // Unidad de negocio: nombre del catálogo o, si el registro no lo tiene, el primer tramo de "Empresa / Depto / Área".
  const unidad = (r: Fila) => r.empresa?.nombre ?? r.empresa_area?.split(" / ")[0] ?? SIN_DATO;
  const porUnidad = Object.entries(contar(filas, unidad))
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
  const unidadesPrincipales = porUnidad.slice(0, MAX_MIEMBROS_DONA);
  const unidadesOtras = porUnidad.slice(MAX_MIEMBROS_DONA);
  const donaUnidades: SegmentoDona[] = [
    ...unidadesPrincipales.map((u, i) => ({ etiqueta: u.nombre, valor: u.total, color: COLOR_EQUIPO[i] })),
    ...(unidadesOtras.length > 0
      ? [{ etiqueta: `Otras (${unidadesOtras.length})`, valor: unidadesOtras.reduce((s, u) => s + u.total, 0), color: COLOR_OTROS }]
      : []),
  ];
  const sinAsignar = activos.filter((r) => r.asignados.length === 0);
  const conCompromiso = activos
    .map((r) => ({ fila: r, fecha: fechaCompromiso(r) }))
    .filter((x): x is { fila: Fila; fecha: string } => x.fecha !== null)
    .map((x) => ({ ...x, dias: diasHasta(x.fecha, hoy) }))
    .sort((a, b) => a.dias - b.dias);
  const recientes = [...filas].sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en)).slice(0, 6);

  const cargaEquipo = equipo
    .map((m) => ({ ...m, total: activos.filter((r) => r.asignados.some((a) => a.id === m.id)).length }))
    .sort((a, b) => b.total - a.total);
  // Máximo 6 segmentos: los miembros con menos carga se agrupan en "Otros".
  const principales = cargaEquipo.slice(0, MAX_MIEMBROS_DONA);
  const otros = cargaEquipo.slice(MAX_MIEMBROS_DONA);
  const donaEquipo: SegmentoDona[] = [
    ...principales.map((m, i) => ({ etiqueta: m.nombre, valor: m.total, color: COLOR_EQUIPO[i] })),
    ...(otros.length > 0 ? [{ etiqueta: `Otros (${otros.length})`, valor: otros.reduce((s, m) => s + m.total, 0), color: COLOR_OTROS }] : []),
    { etiqueta: "Sin asignar", valor: sinAsignar.length, color: COLOR_SIN_ASIGNAR },
  ];
  const donaEstados: SegmentoDona[] = ORDEN_ESTADOS.map((e) => ({ etiqueta: ESTADOS[e], valor: porEstado[e] ?? 0, color: COLOR_BARRA[e] }));
  const donaPrioridad: SegmentoDona[] = [
    ...PRIORIDADES.map((p) => ({ etiqueta: p, valor: porPrioridad[p] ?? 0, color: COLOR_PRIORIDAD[p] })),
    ...((porPrioridad[SIN_DATO] ?? 0) > 0 ? [{ etiqueta: SIN_DATO, valor: porPrioridad[SIN_DATO], color: COLOR_OTROS }] : []),
  ];
  const asignaciones = donaEquipo.reduce((s, x) => s + x.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">
            {esInnovacion ? "Panel de control" : `Hola, ${perfil.nombre.split(" ")[0]}`}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {esInnovacion
              ? "Qué se está trabajando, quién lo tiene y qué requiere atención."
              : "Seguimiento de los requerimientos que has enviado a Innovación."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esInnovacion && <BotonLinkPublico />}
          <Link href="/requerimientos/nuevo" className="btn-primary">+ Nuevo requerimiento</Link>
        </div>
      </div>

      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Indicador etiqueta="Activos" valor={activos.length} href="/requerimientos" detalle={`${filas.length} en total`} />
        {ESTADOS_INDICADOR.map((e) => (
          <Indicador key={e} etiqueta={ESTADOS[e]} valor={porEstado[e] ?? 0} href={`/requerimientos?estado=${e}`} color={COLOR_BARRA[e]} />
        ))}
      </section>

      {/* Donas: avance por estado, carga del equipo (Innovación) y activos por prioridad */}
      <div className={`grid gap-6 md:grid-cols-2 ${esInnovacion ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <section className="card p-5" aria-labelledby="avance">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="avance" className="text-base font-medium text-slate-900">Avance por estado</h2>
            <p className="text-sm text-slate-500">
              {filas.length === 0 ? "Sin requerimientos" : `${porcentaje(porEstado.entregado ?? 0, filas.length)} % entregados`}
            </p>
          </div>
          <div className="mt-4">
            <Dona
              segmentos={donaEstados}
              centro={{ valor: filas.length, etiqueta: "en total" }}
              descripcion={`Requerimientos por estado: ${donaEstados.map((s) => `${s.etiqueta} ${s.valor}`).join(", ")}.`}
            />
          </div>
        </section>

        {esInnovacion && (
          <section className="card p-5" aria-labelledby="carga">
            <h2 id="carga" className="text-base font-medium text-slate-900">Carga del equipo</h2>
            <p className="mt-1 text-sm text-slate-500">Asignaciones de requerimientos activos por miembro.</p>
            <div className="mt-4">
              <Dona
                segmentos={donaEquipo}
                centro={{ valor: asignaciones, etiqueta: "asignaciones" }}
                descripcion={`Carga del equipo: ${donaEquipo.map((s) => `${s.etiqueta} ${s.valor}`).join(", ")}.`}
              />
            </div>
          </section>
        )}

        <section className="card p-5" aria-labelledby="prioridad">
          <h2 id="prioridad" className="text-base font-medium text-slate-900">Activos por prioridad</h2>
          <p className="mt-1 text-sm text-slate-500">Se usa la prioridad final; si no está definida, la sugerida.</p>
          <div className="mt-4">
            <Dona
              segmentos={donaPrioridad}
              centro={{ valor: activos.length, etiqueta: "activos" }}
              descripcion={`Requerimientos activos por prioridad: ${donaPrioridad.map((s) => `${s.etiqueta} ${s.valor}`).join(", ")}.`}
            />
          </div>
        </section>

        <section className="card p-5" aria-labelledby="unidades">
          <h2 id="unidades" className="text-base font-medium text-slate-900">Proyectos por unidad de negocio</h2>
          <p className="mt-1 text-sm text-slate-500">Total de requerimientos de cada unidad, activos y entregados.</p>
          <div className="mt-4">
            <Dona
              segmentos={donaUnidades}
              centro={{ valor: filas.length, etiqueta: "proyectos" }}
              descripcion={`Proyectos por unidad de negocio: ${donaUnidades.map((s) => `${s.etiqueta} ${s.valor}`).join(", ")}.`}
            />
          </div>
        </section>
      </div>

      {/* Requiere atención */}
      <section id="atencion" className="card overflow-hidden" aria-labelledby="atencion-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-2 p-5 pb-3">
          <h2 id="atencion-titulo" className="text-base font-semibold text-slate-900">Próximos compromisos</h2>
          <p className="text-sm text-slate-500">Requerimientos activos con fecha límite o entrega estimada.</p>
        </div>
        {conCompromiso.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">No hay compromisos de fecha pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5">Folio</th>
                  <th className="px-4 py-2.5">Requerimiento</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5">Prioridad</th>
                  {esInnovacion && <th className="px-4 py-2.5">Equipo</th>}
                  <th className="px-4 py-2.5">Compromiso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conCompromiso.slice(0, 8).map(({ fila: r, fecha, dias }) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs">
                      <Link href={`/requerimientos/${r.id}`} className="font-medium text-brand-600 hover:underline">{r.folio}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{tituloProyecto(r)}</p>
                      <p className="text-xs text-slate-500">{r.nombre_solicitante ?? "Sin nombre"} · {r.empresa_area ?? SIN_DATO}</p>
                    </td>
                    <td className="px-4 py-3"><BadgeEstado estado={r.estado} /></td>
                    <td className="px-4 py-3"><BadgePrioridad prioridad={r.prioridad_final ?? r.prioridad_sugerida} /></td>
                    {esInnovacion && (
                      <td className="px-4 py-3 text-slate-700">
                        {r.asignados.length === 0 ? <span className="text-cobre-700">Sin asignar</span> : r.asignados.map((a) => a.nombre.split(" ")[0]).join(", ")}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-800">{formatearFecha(fecha)}</p>
                      <p className={`text-xs ${dias < 0 ? "font-medium text-cobre-700" : dias <= 7 ? "text-cobre-700" : "text-slate-500"}`}>{describirDias(dias)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="areas">
          <h2 id="areas" className="text-base font-semibold text-slate-900">Activos por área</h2>
          {Object.keys(porArea).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin requerimientos activos.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {Object.entries(porArea)
                .sort((a, b) => b[1] - a[1])
                .map(([area, n]) => (
                  <li key={area} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-slate-700">{area}</span>
                    <span className="font-medium text-slate-900">{n}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="actividad">
          <h2 id="actividad" className="text-base font-semibold text-slate-900">Actividad reciente</h2>
          {recientes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aún no hay movimientos.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recientes.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <Link href={`/requerimientos/${r.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">{r.folio}</Link>
                    <p className="truncate text-slate-700">{tituloProyecto(r)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <BadgeEstado estado={r.estado} />
                    <p className="mt-1 text-xs text-slate-500">{formatearFecha(r.actualizado_en, true)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Indicador({ etiqueta, valor, href, detalle, color, alerta }: { etiqueta: string; valor: number; href: string; detalle?: string; color?: string; alerta?: boolean }) {
  return (
    <Link href={href} className={`card flex flex-col gap-1 p-4 transition hover:border-brand-300 hover:shadow-md ${alerta ? "border-cobre-200 bg-cobre-50" : ""}`}>
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {color && <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: color }} />}
        {etiqueta}
      </span>
      <span className={`text-3xl font-semibold tabular-nums ${alerta ? "text-cobre-700" : "text-slate-900"}`}>{valor}</span>
      {detalle && <span className="text-xs text-slate-500">{detalle}</span>}
    </Link>
  );
}


function contar<T>(xs: T[], clave: (x: T) => string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const x of xs) r[clave(x)] = (r[clave(x)] ?? 0) + 1;
  return r;
}

function porcentaje(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

/** La fecha más cercana entre la entrega estimada por Innovación y la fecha límite del solicitante. */
function fechaCompromiso(r: Fila): string | null {
  const fechas = [r.fecha_estimada_entrega, r.fecha_limite].filter((f): f is string => !!f).sort();
  return fechas[0] ?? null;
}

function inicioDelDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diasHasta(iso: string, hoy: Date) {
  const f = new Date(`${iso}T00:00:00`);
  return Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
}

function describirDias(d: number) {
  if (d < -1) return `Atrasado ${-d} días`;
  if (d === -1) return "Atrasado 1 día";
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  return `En ${d} días`;
}
