"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoAuth } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(iniciarSesion, {});

  return (
    <form action={accion} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="correo" className="label">Correo electrónico</label>
        <input id="correo" name="correo" type="email" autoComplete="email" required className="input mt-1" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input mt-1" />
      </div>
      {estado.error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">{estado.error}</p>
      )}
      <button type="submit" disabled={pendiente} className="btn-primary w-full">
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
