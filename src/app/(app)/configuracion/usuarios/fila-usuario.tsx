"use client";

import { useActionState, useState } from "react";
import type { Perfil } from "@/lib/tipos";
import { PasswordGenerada } from "@/components/password-generada";
import { alternarActivo, cambiarRol, eliminarUsuario, reiniciarPassword, type EstadoUsuarios } from "./actions";

type Props = { usuario: Perfil; esYo: boolean; creado: string; deshabilitado: boolean };
type Panel = "reiniciar" | "activo" | "eliminar" | null;

export function FilaUsuario({ usuario, esYo, creado, deshabilitado }: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const cerrarSiOk = (fn: typeof reiniciarPassword) => async (prev: EstadoUsuarios, fd: FormData) => {
    const r = await fn(prev, fd);
    if (r.ok) setPanel(null);
    return r;
  };
  const [resRol, accionRol, pendRol] = useActionState<EstadoUsuarios, FormData>(cambiarRol, {});
  const [resReini, accionReini, pendReini] = useActionState<EstadoUsuarios, FormData>(cerrarSiOk(reiniciarPassword), {});
  const [resActivo, accionActivo, pendActivo] = useActionState<EstadoUsuarios, FormData>(cerrarSiOk(alternarActivo), {});
  const [resDel, accionDel, pendDel] = useActionState<EstadoUsuarios, FormData>(eliminarUsuario, {});

  const ultimo = [resRol, resReini, resActivo, resDel].find((r) => r.error || r.mensaje);
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);
  const btn = "rounded px-2 py-1 text-xs disabled:opacity-50";

  return (
    <>
      <tr className={`hover:bg-slate-50 ${usuario.activo ? "" : "opacity-60"}`}>
        <td className="px-4 py-3 font-medium text-slate-900">
          {usuario.nombre}
          {esYo && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Tú</span>}
        </td>
        <td className="px-4 py-3 text-slate-700">{usuario.correo}</td>
        <td className="px-4 py-3">
          <form action={accionRol}>
            <input type="hidden" name="id" value={usuario.id} />
            <select
              name="rol"
              defaultValue={usuario.rol}
              disabled={deshabilitado || pendRol || esYo}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              aria-label={`Rol de ${usuario.nombre}`}
              className="input w-auto py-1 text-xs"
            >
              <option value="solicitante">Solicitante</option>
              <option value="innovacion">Innovación</option>
            </select>
          </form>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${usuario.activo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
            {usuario.activo ? "Activo" : "Inactivo"}
          </span>
          {usuario.debe_cambiar_password && (
            <span className="ml-1 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800" title="Debe cambiar la contraseña temporal al entrar">
              Contraseña temporal
            </span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{creado}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <button type="button" disabled={deshabilitado} onClick={() => toggle("reiniciar")} className={`${btn} text-slate-600 hover:bg-slate-200`}>
            Reiniciar contraseña
          </button>
          {!esYo && (
            <>
              <button type="button" disabled={deshabilitado} onClick={() => toggle("activo")} className={`${btn} ${usuario.activo ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}>
                {usuario.activo ? "Desactivar" : "Activar"}
              </button>
              <button type="button" disabled={deshabilitado} onClick={() => toggle("eliminar")} className={`${btn} text-red-600 hover:bg-red-50`}>
                Eliminar
              </button>
            </>
          )}
        </td>
      </tr>

      {(panel || ultimo) && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="px-4 py-3">
            {panel === "reiniciar" && (
              <form action={accionReini} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={usuario.id} />
                <input type="hidden" name="correo" value={usuario.correo} />
                <span className="text-sm text-slate-700">
                  Se generará una contraseña temporal para {usuario.nombre}
                  {esYo ? "." : " y deberá cambiarla al entrar."}
                </span>
                <button type="submit" disabled={pendReini} className="btn-primary px-3 py-1.5">
                  {pendReini ? "Generando…" : "Generar nueva contraseña"}
                </button>
                <button type="button" onClick={() => setPanel(null)} className="btn-secondary px-3 py-1.5">Cancelar</button>
              </form>
            )}
            {panel === "activo" && (
              <form action={accionActivo} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={usuario.id} />
                <input type="hidden" name="activar" value={String(!usuario.activo)} />
                <span className="text-sm text-slate-700">
                  {usuario.activo
                    ? `¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión y se cerrará su sesión actual. Sus requerimientos se conservan.`
                    : `¿Activar de nuevo a ${usuario.nombre}? Podrá iniciar sesión con su contraseña.`}
                </span>
                <button type="submit" disabled={pendActivo} className={usuario.activo ? "rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700" : "btn-primary px-3 py-1.5"}>
                  {usuario.activo ? "Sí, desactivar" : "Sí, activar"}
                </button>
                <button type="button" onClick={() => setPanel(null)} className="btn-secondary px-3 py-1.5">Cancelar</button>
              </form>
            )}
            {panel === "eliminar" && (
              <form action={accionDel} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={usuario.id} />
                <span className="text-sm text-red-800">¿Eliminar la cuenta de {usuario.nombre} ({usuario.correo})? Esta acción no se puede deshacer.</span>
                <button type="submit" disabled={pendDel} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setPanel(null)} className="btn-secondary px-3 py-1.5">Cancelar</button>
              </form>
            )}
            {resReini.password && resReini.correo && (
              <div className="mt-2"><PasswordGenerada correo={resReini.correo} password={resReini.password} /></div>
            )}
            {ultimo && !(ultimo === resReini && resReini.password) && (
              <p role={ultimo.error ? "alert" : "status"} className={`mt-2 text-sm ${ultimo.error ? "text-red-700" : "text-emerald-800"}`}>
                {ultimo.error ?? ultimo.mensaje}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
