"use client";

import { useActionState, useEffect, useRef } from "react";
import { PasswordGenerada } from "@/components/password-generada";
import { crearUsuario, type EstadoUsuarios } from "./actions";

export function FormNuevoUsuario({ deshabilitado }: { deshabilitado: boolean }) {
  const [res, accion, pendiente] = useActionState<EstadoUsuarios, FormData>(crearUsuario, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (res.ok) ref.current?.reset();
  }, [res]);

  return (
    <form ref={ref} action={accion} className="mt-4 space-y-4">
      <fieldset disabled={deshabilitado || pendiente} className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nombre" className="label">Nombre completo</label>
          <input id="nombre" name="nombre" required autoComplete="off" className="input mt-1" />
        </div>
        <div>
          <label htmlFor="correo" className="label">Correo electrónico</label>
          <input id="correo" name="correo" type="email" required autoComplete="off" className="input mt-1" />
        </div>
        <div>
          <label htmlFor="rol" className="label">Rol</label>
          <select id="rol" name="rol" defaultValue="solicitante" className="input mt-1">
            <option value="solicitante">Solicitante</option>
            <option value="innovacion">Equipo de Innovación</option>
          </select>
        </div>
      </fieldset>
      <p className="text-xs text-slate-500">
        El sistema genera una contraseña temporal. El usuario deberá cambiarla la primera vez que entre.
      </p>
      {res.error && <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">{res.error}</p>}
      {res.password && res.correo && !pendiente && <PasswordGenerada correo={res.correo} password={res.password} />}
      <div className="flex justify-end">
        <button type="submit" disabled={deshabilitado || pendiente} className="btn-primary">
          {pendiente ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
