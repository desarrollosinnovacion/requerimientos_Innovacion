"use client";

import { useActionState, useEffect } from "react";
import type { AplicacionFila, RequerimientoOpcion } from "@/lib/credenciales";
import { crearAplicacion, editarAplicacion, type EstadoFormAplicacion } from "./actions";

type Props = {
  empresas: { id: string; nombre: string }[];
  requerimientos: RequerimientoOpcion[];
  /** Con valor, el formulario edita esa aplicación; sin él, crea una nueva. */
  inicial?: AplicacionFila;
  /** Se llama con el id de la aplicación cuando quedó guardada. */
  alGuardar: (id: string) => void;
  alCancelar: () => void;
};

const Error = ({ msj }: { msj?: string }) => (msj ? <p role="alert" className="mt-1 text-xs text-cobre-700">{msj}</p> : null);

/** Alta y edición de una aplicación (ficha a la que se cuelgan las credenciales). */
export function FormAplicacion({ empresas, requerimientos, inicial, alGuardar, alCancelar }: Props) {
  const editando = Boolean(inicial);
  const [res, accion, pendiente] = useActionState<EstadoFormAplicacion, FormData>(editando ? editarAplicacion : crearAplicacion, {});
  const errores = res.errores ?? {};

  useEffect(() => {
    if (res.ok && res.id) alGuardar(res.id);
    // Solo reacciona al resultado de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  return (
    <form action={accion} className="space-y-4">
      <div>
        <h2 className="text-base font-medium text-slate-900">{editando ? "Editar aplicación" : "Nueva aplicación"}</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          {editando ? "Cambia los datos generales; las credenciales se administran en la ficha." : "Primero la ficha; después se le agregan sus credenciales."}
        </p>
      </div>
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="nombre" className="label">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            required
            maxLength={120}
            autoFocus
            defaultValue={inicial?.nombre ?? ""}
            placeholder="Ej. Portal de requerimientos"
            aria-invalid={errores.nombre ? true : undefined}
            className="input mt-1"
          />
          <Error msj={errores.nombre} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="url" className="label">URL <span className="font-normal text-slate-500">(opcional)</span></label>
          <input
            id="url"
            name="url"
            type="url"
            maxLength={500}
            defaultValue={inicial?.url ?? ""}
            placeholder="https://…"
            aria-invalid={errores.url ? true : undefined}
            className="input mt-1"
          />
          <Error msj={errores.url} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="label">Descripción <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={2}
            maxLength={2000}
            defaultValue={inicial?.descripcion ?? ""}
            placeholder="Para qué sirve, quién la usa, dónde está alojada."
            className="input mt-1"
          />
          <Error msj={errores.descripcion} />
        </div>

        <div>
          <label htmlFor="empresa_id" className="label">Unidad de negocio</label>
          <select id="empresa_id" name="empresa_id" defaultValue={inicial?.empresa_id ?? ""} className="input mt-1">
            <option value="">Sin especificar</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <Error msj={errores.empresa_id} />
        </div>

        <div>
          <label htmlFor="requerimiento_id" className="label">Requerimiento relacionado</label>
          <select id="requerimiento_id" name="requerimiento_id" defaultValue={inicial?.requerimiento_id ?? ""} className="input mt-1">
            <option value="">Ninguno</option>
            {requerimientos.map((r) => (
              <option key={r.id} value={r.id}>{r.folio}{r.nombre_proyecto ? ` · ${r.nombre_proyecto}` : ""}</option>
            ))}
          </select>
          <Error msj={errores.requerimiento_id} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {res.error && !res.ok && <p role="alert" className="mr-auto text-sm text-cobre-700">{res.error}</p>}
        <button type="button" onClick={alCancelar} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={pendiente} className="btn-primary">
          {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Crear aplicación"}
        </button>
      </div>
    </form>
  );
}
