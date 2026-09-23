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

/**
 * Panel de métricas sobre la lista de incidencias. Todas las gráficas se calculan
 * sobre el total de incidencias visibles para el usuario, sin importar la pestaña
 * activa; los indicadores de arriba ya separan por estado.
 */
export function MetricasIncidencias({ incidencias }: { incidencias: IncidenciaFila[] }) {
  const porEstado = contar(incidencias, (i) => i.estado);

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
  const resueltas = porEstado.resuelta ?? 0;

  return (
    <div className="space-y-6">
      <section aria-label="Indicadores de incidencias" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador etiqueta="Total" valor={total} href="/incidencias" detalle={total === 0 ? undefined : `${porcentaje(resueltas, total)} % resueltas`} />
        {ORDEN.map((e) => (
          <Indicador
            key={e}
            etiqueta={e === "abierta" ? "Abiertas" : e === "en_proceso" ? "En proceso" : "Resueltas"}
            valor={porEstado[e] ?? 0}
            href={`/incidencias?estado=${e}`}
            color={COLOR_ESTADO_INCIDENCIA[e]}
            alerta={e === "abierta" && (porEstado[e] ?? 0) > 0}
          />
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Tarjeta id="inc-estado" titulo="Por estado">
          <Dona
            segmentos={donaEstados}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por estado: ${resumen(donaEstados)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-responsable" titulo="Por responsable">
          <Dona
            segmentos={donaResponsable}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por responsable: ${resumen(donaResponsable)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-prioridad" titulo="Por prioridad">
          <Dona
            segmentos={donaPrioridad}
            centro={{ valor: total, etiqueta: "en total" }}
            descripcion={`Incidencias por prioridad: ${resumen(donaPrioridad)}.`}
          />
        </Tarjeta>
        <Tarjeta id="inc-unidad" titulo="Por unidad de negocio">
          <Dona
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
    <section className="card p-5" aria-labelledby={id}>
      <h2 id={id} className="text-base font-medium text-slate-900">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
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
