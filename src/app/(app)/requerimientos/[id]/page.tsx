import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { SECCIONES, cumpleCondicion, type Campo } from "@/lib/formulario";
import { formatearFecha } from "@/lib/formato";
import type { MiembroEquipo, Requerimiento } from "@/lib/tipos";
import { BadgeEstado, BadgePrioridad } from "@/components/badges";
import { PanelInnovacion } from "./panel-innovacion";

export default async function DetalleRequerimiento(props: PageProps<"/requerimientos/[id]">) {
  const { id } = await props.params;
  const { creado } = await props.searchParams;
  const { supabase, perfil } = await requerirUsuario();

  const { data: req } = await supabase.from("requerimientos").select("*").eq("id", id).maybeSingle<Requerimiento>();

  if (!req) notFound();

  const esInnovacion = perfil.rol === "innovacion";

  const [{ data: asignadosData }, { data: equipoData }] = await Promise.all([
    supabase
      .from("requerimiento_asignados")
      .select("perfil_id, perfil:perfiles(id, nombre)")
      .eq("requerimiento_id", id),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);
  const asignados: MiembroEquipo[] = (asignadosData ?? [])
    .map((a) => a.perfil as unknown as MiembroEquipo | null)
    .filter((p): p is MiembroEquipo => p !== null);
  const equipo: MiembroEquipo[] = (equipoData ?? []) as MiembroEquipo[];

  return (
    <div className="space-y-6">
      {creado === "1" && (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Tu requerimiento fue enviado con el folio <strong>{req.folio}</strong>. El Departamento de
          Innovación lo evaluará y te dará seguimiento.
        </p>
      )}

      <div>
        <Link href="/requerimientos" className="text-sm text-slate-500 hover:text-slate-800">
          ← Volver a la lista
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold text-slate-900">{req.folio}</h1>
          <BadgeEstado estado={req.estado} />
        </div>
        <p className="mt-1 text-slate-700">{req.tipo_requerimiento}</p>
        <p className="mt-1 text-sm text-slate-500">
          Enviado por {req.nombre_solicitante} ({req.empresa_area}) el {formatearFecha(req.creado_en, true)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {SECCIONES.map((seccion) => {
            const campos = seccion.campos.filter((c) => cumpleCondicion(c, req) && tieneValor(req[c.nombre]));
            if (campos.length === 0) return null;
            return (
              <section key={seccion.id} className="card p-6">
                <h2 className="text-base font-semibold text-slate-900">{seccion.titulo}</h2>
                <dl className="mt-4 divide-y divide-slate-100">
                  {campos.map((c) => (
                    <div key={c.nombre} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-4">
                      <dt className="text-sm font-medium text-slate-600">{c.etiqueta}</dt>
                      <dd className="text-sm text-slate-900">{renderValor(c, req)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Seguimiento</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Estado del proyecto</dt>
                <dd><BadgeEstado estado={req.estado} /></dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Prioridad sugerida</dt>
                <dd><BadgePrioridad prioridad={req.prioridad_sugerida} /></dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Prioridad final</dt>
                <dd><BadgePrioridad prioridad={req.prioridad_final} /></dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Equipo asignado</dt>
                <dd className="text-right text-slate-900">
                  {asignados.length === 0 ? (
                    <span className="text-slate-400">Sin asignar</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {asignados.map((m) => <li key={m.id}>{m.nombre}</li>)}
                    </ul>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Entrega estimada</dt>
                <dd className="text-slate-900">{formatearFecha(req.fecha_estimada_entrega)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600">Última actualización</dt>
                <dd className="text-slate-900">{formatearFecha(req.actualizado_en, true)}</dd>
              </div>
            </dl>
            {req.notas_innovacion && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Respuesta de Innovación</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{req.notas_innovacion}</p>
              </div>
            )}
          </div>

          {esInnovacion && (
            <PanelInnovacion
              id={req.id}
              estado={req.estado}
              prioridadFinal={req.prioridad_final}
              fechaEstimada={req.fecha_estimada_entrega}
              notas={req.notas_innovacion}
              equipo={equipo}
              asignados={asignados.map((m) => m.id)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function tieneValor(v: unknown) {
  return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
}

function renderValor(campo: Campo, req: Requerimiento) {
  const v = req[campo.nombre];
  const otro = "otro" in campo && campo.otro ? req[campo.otro] : null;

  if (Array.isArray(v)) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {v.map((op) => (
          <li key={op} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-800">
            {op === "Otro" && otro ? `Otro: ${otro}` : op}
          </li>
        ))}
      </ul>
    );
  }
  if (campo.tipo === "fecha") return formatearFecha(v as string);
  if (campo.tipo === "empresa_area") return <span>{v as string}</span>;
  if (v === "Otro" && otro) return `Otro: ${otro}`;
  return <span className="whitespace-pre-wrap">{v as string}</span>;
}
