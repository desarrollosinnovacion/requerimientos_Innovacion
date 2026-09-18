import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { ESTADOS, PRIORIDADES, type Estado } from "@/lib/formulario";
import { formatearFecha } from "@/lib/formato";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgeEstado, BadgePrioridad } from "@/components/badges";

type Fila = {
  id: string;
  folio: string;
  estado: Estado;
  tipo_requerimiento: string;
  prioridad_sugerida: string;
  prioridad_final: string | null;
  nombre_solicitante: string;
  empresa_area: string;
  fecha_limite: string | null;
  fecha_estimada_entrega: string | null;
  creado_en: string;
  actualizado_en: string;
  asignados: MiembroEquipo[];
};

type FilaCruda = Omit<Fila, "asignados"> & { asignados: { perfil: unknown }[] | null };

/** Colores de estado para las barras (validados para daltonismo; el gris es intencional = sin empezar). */
const COLOR_BARRA: Record<Estado, string> = {
  no_iniciado: "#64748b",
  iniciado: "#4f46e5",
  en_pruebas: "#d97706",
  finalizado: "#059669",
};

const ORDEN_ESTADOS: Estado[] = ["no_iniciado", "iniciado", "en_pruebas", "finalizado"];

export default async function Inicio() {
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const [{ data: crudas }, { data: equipoData }] = await Promise.all([
    supabase
      .from("requerimientos")
      .select(
        "id, folio, estado, tipo_requerimiento, prioridad_sugerida, prioridad_final, nombre_solicitante, empresa_area, fecha_limite, fecha_estimada_entrega, creado_en, actualizado_en, asignados:requerimiento_asignados(perfil:perfiles(id, nombre))",
      )
      .order("creado_en", { ascending: false })
      .returns<FilaCruda[]>(),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);

  const filas: Fila[] = (crudas ?? []).map((r) => ({
    ...r,
    asignados: (r.asignados ?? [])
      .map((a) => a.perfil as MiembroEquipo | null)
      .filter((p): p is MiembroEquipo => p !== null),
  }));
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  const hoy = inicioDelDia(new Date());
  const activos = filas.filter((r) => r.estado !== "finalizado");
  const porEstado = contar(filas, (r) => r.estado);
  const porPrioridad = contar(activos, (r) => r.prioridad_final ?? r.prioridad_sugerida);
  const porArea = contar(activos, (r) => r.empresa_area);
  const sinAsignar = activos.filter((r) => r.asignados.length === 0);
  const conCompromiso = activos
    .map((r) => ({ fila: r, fecha: fechaCompromiso(r) }))
    .filter((x): x is { fila: Fila; fecha: string } => x.fecha !== null)
    .map((x) => ({ ...x, dias: diasHasta(x.fecha, hoy) }))
    .sort((a, b) => a.dias - b.dias);
  const atrasados = conCompromiso.filter((x) => x.dias < 0);
  const recientes = [...filas].sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en)).slice(0, 6);

  const cargaEquipo = equipo.map((m) => ({
    ...m,
    total: activos.filter((r) => r.asignados.some((a) => a.id === m.id)).length,
  }));
  const maxCarga = Math.max(1, ...cargaEquipo.map((c) => c.total), sinAsignar.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {esInnovacion ? "Panel de control" : `Hola, ${perfil.nombre.split(" ")[0]}`}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {esInnovacion
              ? "Qué se está trabajando, quién lo tiene y qué requiere atención."
              : "Seguimiento de los requerimientos que has enviado a Innovación."}
          </p>
        </div>
        <Link href="/requerimientos/nuevo" className="btn-primary">+ Nuevo requerimiento</Link>
      </div>

      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Indicador etiqueta="Activos" valor={activos.length} href="/requerimientos" detalle={`${filas.length} en total`} />
        {ORDEN_ESTADOS.map((e) => (
          <Indicador key={e} etiqueta={ESTADOS[e]} valor={porEstado[e] ?? 0} href={`/requerimientos?estado=${e}`} color={COLOR_BARRA[e]} />
        ))}
        <Indicador
          etiqueta="Atrasados"
          valor={atrasados.length}
          href="#atencion"
          alerta={atrasados.length > 0}
          detalle={esInnovacion ? `${sinAsignar.length} sin asignar` : undefined}
        />
      </section>

      {/* Avance por estado */}
      <section className="card p-5" aria-labelledby="avance">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="avance" className="text-base font-semibold text-slate-900">Avance por estado</h2>
          <p className="text-sm text-slate-500">
            {filas.length === 0 ? "Sin requerimientos" : `${porcentaje(porEstado.finalizado ?? 0, filas.length)} % finalizados`}
          </p>
        </div>
        {filas.length > 0 && (
          <>
            <div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded" role="img" aria-label={ORDEN_ESTADOS.map((e) => `${ESTADOS[e]}: ${porEstado[e] ?? 0}`).join(", ")}>
              {ORDEN_ESTADOS.filter((e) => (porEstado[e] ?? 0) > 0).map((e) => (
                <div
                  key={e}
                  title={`${ESTADOS[e]}: ${porEstado[e]}`}
                  style={{ width: `${porcentaje(porEstado[e], filas.length)}%`, background: COLOR_BARRA[e] }}
                  className="h-full rounded-sm"
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {ORDEN_ESTADOS.map((e) => (
                <li key={e} className="flex items-center gap-2 text-slate-700">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_BARRA[e] }} />
                  {ESTADOS[e]}
                  <span className="font-medium text-slate-900">{porEstado[e] ?? 0}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className={`grid gap-6 ${esInnovacion ? "lg:grid-cols-2" : ""}`}>
        {esInnovacion && (
          <section className="card p-5" aria-labelledby="carga">
            <h2 id="carga" className="text-base font-semibold text-slate-900">Carga del equipo</h2>
            <p className="mt-1 text-sm text-slate-500">Requerimientos activos asignados a cada miembro.</p>
            <ul className="mt-4 space-y-3">
              {cargaEquipo.map((m) => (
                <Barra key={m.id} etiqueta={m.nombre} valor={m.total} max={maxCarga} color="#4f46e5" />
              ))}
              <Barra etiqueta="Sin asignar" valor={sinAsignar.length} max={maxCarga} color="#64748b" enfasis={sinAsignar.length > 0} />
            </ul>
          </section>
        )}

        <section className="card p-5" aria-labelledby="prioridad">
          <h2 id="prioridad" className="text-base font-semibold text-slate-900">Activos por prioridad</h2>
          <p className="mt-1 text-sm text-slate-500">Se usa la prioridad final; si no está definida, la sugerida.</p>
          <ul className="mt-4 space-y-3">
            {PRIORIDADES.map((p) => (
              <Barra key={p} etiqueta={p} valor={porPrioridad[p] ?? 0} max={Math.max(1, ...Object.values(porPrioridad))} color={COLOR_PRIORIDAD[p]} />
            ))}
          </ul>
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
                      <p className="text-slate-800">{r.tipo_requerimiento}</p>
                      <p className="text-xs text-slate-500">{r.nombre_solicitante} · {r.empresa_area}</p>
                    </td>
                    <td className="px-4 py-3"><BadgeEstado estado={r.estado} /></td>
                    <td className="px-4 py-3"><BadgePrioridad prioridad={r.prioridad_final ?? r.prioridad_sugerida} /></td>
                    {esInnovacion && (
                      <td className="px-4 py-3 text-slate-700">
                        {r.asignados.length === 0 ? <span className="text-amber-700">Sin asignar</span> : r.asignados.map((a) => a.nombre.split(" ")[0]).join(", ")}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-800">{formatearFecha(fecha)}</p>
                      <p className={`text-xs ${dias < 0 ? "font-medium text-red-700" : dias <= 7 ? "text-amber-700" : "text-slate-500"}`}>{describirDias(dias)}</p>
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
                    <p className="truncate text-slate-700">{r.tipo_requerimiento}</p>
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

const COLOR_PRIORIDAD: Record<string, string> = {
  Crítica: "#b91c1c",
  Alta: "#c2410c",
  Media: "#a16207",
  Baja: "#64748b",
};

function Indicador({ etiqueta, valor, href, detalle, color, alerta }: { etiqueta: string; valor: number; href: string; detalle?: string; color?: string; alerta?: boolean }) {
  return (
    <Link href={href} className={`card flex flex-col gap-1 p-4 transition hover:border-brand-300 hover:shadow-md ${alerta ? "border-red-200 bg-red-50" : ""}`}>
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {color && <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: color }} />}
        {etiqueta}
      </span>
      <span className={`text-3xl font-semibold tabular-nums ${alerta ? "text-red-700" : "text-slate-900"}`}>{valor}</span>
      {detalle && <span className="text-xs text-slate-500">{detalle}</span>}
    </Link>
  );
}

function Barra({ etiqueta, valor, max, color, enfasis }: { etiqueta: string; valor: number; max: number; color: string; enfasis?: boolean }) {
  return (
    <li className="grid grid-cols-[minmax(0,150px)_1fr_2rem] items-center gap-3 text-sm">
      <span className={`truncate ${enfasis ? "font-medium text-amber-700" : "text-slate-700"}`}>{etiqueta}</span>
      <div className="h-2.5 w-full rounded bg-slate-100" title={`${etiqueta}: ${valor}`}>
        <div className="h-full rounded" style={{ width: `${porcentaje(valor, max)}%`, background: color }} />
      </div>
      <span className="text-right font-medium tabular-nums text-slate-900">{valor}</span>
    </li>
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
