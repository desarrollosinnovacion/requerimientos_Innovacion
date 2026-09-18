"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { alternarActivo, eliminarElemento, renombrarElemento, type EstadoCatalogo, type Nivel } from "./actions";

type Props = {
  nivel: Nivel;
  id: string;
  nombre: string;
  activo: boolean;
  seleccionado?: boolean;
  href?: string;
  conteoHijos?: number;
  etiquetaHijos?: string;
};

export function ElementoCatalogo({ nivel, id, nombre, activo, seleccionado, href, conteoHijos, etiquetaHijos = "elementos" }: Props) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [resRenombrar, accionRenombrar, pendRenombrar] = useActionState<EstadoCatalogo, FormData>(
    async (prev, fd) => {
      const r = await renombrarElemento(prev, fd);
      if (r.ok) setEditando(false);
      return r;
    },
    {},
  );
  const [resEliminar, accionEliminar, pendEliminar] = useActionState<EstadoCatalogo, FormData>(eliminarElemento, {});

  const base = `group flex flex-col gap-1 rounded-md border px-3 py-2 text-sm ${
    seleccionado ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"
  } ${activo ? "" : "opacity-60"}`;

  if (editando) {
    return (
      <li className={base}>
        <form action={accionRenombrar} className="flex items-center gap-2">
          <input type="hidden" name="nivel" value={nivel} />
          <input type="hidden" name="id" value={id} />
          <input name="nombre" defaultValue={nombre} autoFocus required className="input py-1" aria-label="Nuevo nombre" />
          <button type="submit" disabled={pendRenombrar} className="btn-primary px-2 py-1 text-xs">Guardar</button>
          <button type="button" onClick={() => setEditando(false)} className="btn-secondary px-2 py-1 text-xs">Cancelar</button>
        </form>
        {resRenombrar.error && <p role="alert" className="text-xs text-red-600">{resRenombrar.error}</p>}
      </li>
    );
  }

  return (
    <li className={base}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {href ? (
            <Link href={href} className="block truncate font-medium text-slate-900 hover:text-brand-700">
              {nombre}
            </Link>
          ) : (
            <span className="block truncate font-medium text-slate-900">{nombre}</span>
          )}
          <span className="text-xs text-slate-500">
            {activo ? "Activo" : "Inactivo"}
            {typeof conteoHijos === "number" && ` · ${conteoHijos} ${etiquetaHijos}`}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          <button type="button" onClick={() => setEditando(true)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200" title="Renombrar">
            Editar
          </button>
          <form action={alternarActivo}>
            <input type="hidden" name="nivel" value={nivel} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="activo" value={String(!activo)} />
            <button type="submit" className="rounded px-2 py-1 text-slate-600 hover:bg-slate-200" title={activo ? "Desactivar" : "Activar"}>
              {activo ? "Desactivar" : "Activar"}
            </button>
          </form>
          <button type="button" onClick={() => setConfirmando((v) => !v)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50" title="Eliminar">
            Eliminar
          </button>
        </div>
      </div>
      {confirmando && (
        <form action={accionEliminar} className="flex flex-wrap items-center gap-2 rounded bg-red-50 px-2 py-1.5">
          <input type="hidden" name="nivel" value={nivel} />
          <input type="hidden" name="id" value={id} />
          <span className="text-xs text-red-800">¿Eliminar &quot;{nombre}&quot;{conteoHijos ? " y todo su contenido" : ""}?</span>
          <button type="submit" disabled={pendEliminar} className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700">
            Sí, eliminar
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="text-xs text-slate-600 underline">No</button>
        </form>
      )}
      {resEliminar.error && <p role="alert" className="text-xs text-red-600">{resEliminar.error}</p>}
    </li>
  );
}
