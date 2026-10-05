"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import type { AplicacionFila, RequerimientoOpcion } from "@/lib/credenciales";
import { formatearFecha } from "@/lib/formato";
import { eliminarAplicacion } from "../actions";
import { ModalAplicacion } from "../modal-aplicacion";

type Props = {
  app: AplicacionFila;
  totalCredenciales: number;
  empresas: { id: string; nombre: string }[];
  requerimientos: RequerimientoOpcion[];
};

/** Datos generales de la aplicación con botones Editar y Eliminar (confirmación en dos pasos). */
export function EncabezadoAplicacion({ app, totalCredenciales, empresas, requerimientos }: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function eliminar() {
    setError(null);
    startTransition(async () => {
      const r = await eliminarAplicacion(app.id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push("/credenciales");
    });
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-slate-900">{app.nombre}</h1>
          {app.descripcion && <p className="mt-1 text-sm text-slate-600">{app.descripcion}</p>}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {app.url && (
              <div>
                <dt className="etiqueta">URL</dt>
                <dd>
                  <a href={app.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                    {app.url.replace(/^https?:\/\//, "")}
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="etiqueta">Unidad de negocio</dt>
              <dd className="text-slate-800">{app.empresa?.nombre ?? "Sin unidad"}</dd>
            </div>
            <div>
              <dt className="etiqueta">Requerimiento</dt>
              <dd>
                {app.requerimiento ? (
                  <Link href={`/requerimientos/${app.requerimiento.id}`} className="text-brand-600 hover:underline">
                    {app.requerimiento.folio}{app.requerimiento.nombre_proyecto ? ` · ${app.requerimiento.nombre_proyecto}` : ""}
                  </Link>
                ) : (
                  <span className="text-slate-800">Ninguno</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="etiqueta">Actualizada</dt>
              <dd className="text-slate-800">{formatearFecha(app.actualizado_en, true)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModalAplicacion empresas={empresas} requerimientos={requerimientos} inicial={app} />
          <button
            type="button"
            onClick={() => setConfirmando((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-cobre-200 bg-white px-3 py-1.5 text-xs font-medium text-cobre-700 transition hover:bg-cobre-50"
          >
            <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
            Eliminar aplicación
          </button>
        </div>
      </div>

      {confirmando && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-cobre-50 px-4 py-3">
          <p className="text-sm text-cobre-800">
            ¿Eliminar «{app.nombre}»
            {totalCredenciales > 0 ? ` y sus ${totalCredenciales} credencial${totalCredenciales === 1 ? "" : "es"}` : ""}? Esta acción no se puede
            deshacer; la bitácora conserva el registro.
          </p>
          <button
            type="button"
            onClick={eliminar}
            disabled={pendiente}
            className="rounded-md bg-cobre-600 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-cobre-700 disabled:opacity-60"
          >
            {pendiente ? "Eliminando…" : "Sí, eliminar"}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="btn-secondary px-3 py-1.5">Cancelar</button>
          {error && <p role="alert" className="w-full text-sm text-cobre-700">{error}</p>}
        </div>
      )}
    </section>
  );
}
