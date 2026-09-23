import Link from "next/link";
import { Dona, type SegmentoDona } from "@/components/dona";
import { PRIORIDADES } from "@/lib/formulario";
import { COLOR_CATEGORIA, COLOR_OTROS, COLOR_PRIORIDAD, COLOR_SIN_ASIGNAR, MAX_SEGMENTOS_DONA } from "@/lib/colores-estado";
import {
  COLOR_ESTADO_INCIDENCIA,
  ESTADOS_INCIDENCIA,
  type EstadoIncidencia,
  type IncidenciaFila,
} from "@/lib/incidencias";

const SIN_DATO = "Sin definir";
const SIN_UNIDAD = "Sin unidad";
const ORDEN = Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[];
/** Donas compactas: el panel va sobre la lista y no debe robarle espacio. */
const TAMANO_DONA = 112;

type Props = {
  /** Incidencias que pasan todos los filtros: alimentan las donas. */
  incidencias: IncidenciaFila[];
  /** Incidencias que pasan todos los filtros menos el de estado: alimentan los indicadores. */
  paraIndicadores: IncidenciaFila[];
  /** Enlace que conserva los demás filtros y fija (o quita) el estado. */
  hrefEstado: (estado: EstadoIncidencia | "") => string;
  estadoActivo: EstadoIncidencia | "";
};

/**
 * Panel de métricas sobre la lista de incidencias. Sigue los filtros activos:
 * las donas se calculan sobre lo filtrado y los indicadores de estado sirven
 * para cambiar de estado sin perder los demás filtros.
 */
export function MetricasIncidencias({ incidencias, paraIndicadores, hrefEstado, estadoActivo }: Props) {
  const porEstado = contar(incidencias, (i) => i.estado);
  const indicadores = contar(paraIndicadores, (i) => i.estado);

  const donaEstados: SegmentoDona[] = ORDEN.map((e) => ({
    etiqueta: ESTADOS_INCIDENCIA[e],
    valor: porEstado[e] ?? 0,
    color: COLOR_ESTADO_INCIDENCIA[e],
  }));

  const porPrioridad = contar(incidencias, (i) => i.prioridad ?? SIN_DATO);
  const donaPrioridad: SegmentoDona[] = [
    ...PRIORIDADES.map((p) => ({ etiqueta: p, valor: porPrioridad[p] ?? 0, color: COLOR_PRIORIDAD[p] })),
    ...((porPrioridad[SIN_DATO] ?? 0) > 0 ? [{ etiqueta: SIN_DATO, valor: porPrioridad[SIN_DATO], color: COLOR_OTROS }] : []),
  ];

  const donaResponsable = agrupar(
    incidencias.filter((i) => i.asignado),
    (i) => i.asignado!.nombre,
    "Otros",
  );
  donaResponsable.push({ etiqueta: "Sin asignar", valor: incidencias.filter((i) => !i.asignado).length, color: COLOR_SIN_ASIGNAR });

  const donaUnidades = agrupar(incidencias, (i) => i.empresa?.nombre ?? SIN_UNIDAD, "Otras");

  const total = incidencias.length;
  const totalIndicadores = paraIndicadores.length;
  const resueltas = indicadores.resuelta ?? 0;

  return (
    <div className="space-y-3">
      <section aria-label="Indicadores de incidencias" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          etiqueta="Total"
          valor={totalIndicadores}
          href={hrefEstado("")}
          activo={estadoActivo === ""}
          detalle={totalIndicadores === 0 ? undefined : `${porcentaje(resueltas, totalIndicadores)} % resueltas`}
        />
        {ORDEN.map((e) => (
          <Indicador
            key={e}
            etiqueta={e === "abierta" ? "Abiertas" : e === "en_proceso" ? "En proceso" : "Resueltas"}
            valor={indicadores[e] ?? 0}
            href={hrefEstado(e)}
            activo={estadoActivo === e}
            color={COLOR_ESTADO_INCIDENCIA[e]}
            alerta={e === "abierta" && (indicadores[e] ?? 0) > 0}
          />
        ))}
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Tarjeta id="inc-estado" titulo="Por estado">
          <Dona
            tamano={TAMANO_DONA}
            compacto
            segmentos={donaEstados}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por estado: ${resumen(donaEstados)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-responsable" titulo="Por responsable">
          <Dona
            tamano={TAMANO_DONA}
            compacto
            segmentos={donaResponsable}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por responsable: ${resumen(donaResponsable)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-prioridad" titulo="Por prioridad">
          <Dona
            tamano={TAMANO_DONA}
            compacto
            segmentos={donaPrioridad}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por prioridad: ${resumen(donaPrioridad)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-unidad" titulo="Por unidad de negocio">
          <Dona
            tamano={TAMANO_DONA}
            compacto
            segmentos={donaUnidades}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por unidad de negocio: ${resumen(donaUnidades)}.`}
          />
        </Tarjeta>
      </div>
    </div>
  );
}

function Tarjeta({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="card p-4" aria-labelledby={id}>
      <h2 id={id} className="text-sm font-medium text-slate-900">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

type PropsIndicador = { etiqueta: string; valor: number; href: string; activo: boolean; detalle?: string; color?: string; alerta?: boolean };

/** Tarjeta-enlace de estado; la activa lleva borde verde para indicar el filtro vigente. */
function Indicador({ etiqueta, valor, href, activo, detalle, color, alerta }: PropsIndicador) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`card flex items-center justify-between gap-3 px-4 py-3 transition hover:border-brand-300 hover:shadow-md ${
        alerta ? "border-cobre-200 bg-cobre-50" : ""
      } ${activo ? "border-brand-600 ring-1 ring-brand-600" : ""}`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {color && <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: color }} />}
          {etiqueta}
        </span>
        {detalle && <span className="text-xs text-slate-500">{detalle}</span>}
      </span>
      <span className={`text-2xl font-semibold tabular-nums ${alerta ? "text-cobre-700" : "text-slate-900"}`}>{valor}</span>
    </Link>
  );
}

/** Cuenta por categoría, ordena de mayor a menor y agrupa el sobrante en "Otros/Otras". */
function agrupar<T>(xs: T[], clave: (x: T) => string, etiquetaResto: string): SegmentoDona[] {
  const lista = Object.entries(contar(xs, clave))
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta, "es"));
  const principales = lista.slice(0, MAX_SEGMENTOS_DONA);
  const resto = lista.slice(MAX_SEGMENTOS_DONA);
  return [
    ...principales.map((x, i) => ({ ...x, color: COLOR_CATEGORIA[i] })),
    ...(resto.length > 0 ? [{ etiqueta: `${etiquetaResto} (${resto.length})`, valor: resto.reduce((s, x) => s + x.valor, 0), color: COLOR_OTROS }] : []),
  ];
}

function contar<T>(xs: T[], clave: (x: T) => string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const x of xs) r[clave(x)] = (r[clave(x)] ?? 0) + 1;
  return r;
}

function porcentaje(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function resumen(segmentos: SegmentoDona[]) {
  return segmentos.map((s) => `${s.etiqueta} ${s.valor}`).join(", ");
}
