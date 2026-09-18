"use client";

import { useActionState } from "react";
import { cambiarPassword, type EstadoCambio } from "./actions";

export function CambiarPasswordForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCambio, FormData>(cambiarPassword, {});

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">Nueva contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input mt-1" />
        <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      </div>
      <div>
        <label htmlFor="confirmar" className="label">Confirmar contraseña</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required className="input mt-1" />
      </div>
      {estado.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}
      <button type="submit" disabled={pendiente} className="btn-primary w-full">
        {pendiente ? "Guardando…" : "Guardar y continuar"}
      </button>
    </form>
  );
}
