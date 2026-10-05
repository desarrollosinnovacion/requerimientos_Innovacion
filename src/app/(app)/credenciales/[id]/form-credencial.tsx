"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { AMBIENTES, ETIQUETAS_AMBIENTE, MAX_SECRETO, idsTitularesMfa, type CredencialFila } from "@/lib/credenciales";
import { generarPasswordNavegador } from "@/lib/password-navegador";
import type { MiembroEquipo } from "@/lib/tipos";
import { crearCredencial, editarCredencial, type EstadoFormCredencial } from "../actions";

type Props = {
  aplicacionId: string;
  /** Miembros activos de Innovación, para marcar quiénes tienen el MFA. */
  equipo: MiembroEquipo[];
  /** Con valor, el formulario edita esa credencial (el secreto solo se cambia si se escribe uno nuevo). */
  inicial?: CredencialFila;
  alGuardar: () => void;
  alCancelar: () => void;
};

const Error = ({ msj }: { msj?: string }) => (msj ? <p role="alert" className="mt-1 text-xs text-cobre-700">{msj}</p> : null);

/** Alta y edición de una credencial. El secreto se cifra en el servidor; aquí solo se captura. */
export function FormCredencial({ aplicacionId, equipo, inicial, alGuardar, alCancelar }: Props) {
  const editando = Boolean(inicial);
  const [res, accion, pendiente] = useActionState<EstadoFormCredencial, FormData>(editando ? editarCredencial : crearCredencial, {});
  const [secreto, setSecreto] = useState("");
  const [visible, setVisible] = useState(false);
  const [tieneMfa, setTieneMfa] = useState(inicial?.tiene_mfa ?? false);
  const titularesIniciales = inicial ? idsTitularesMfa(inicial) : [];
  const errores = res.errores ?? {};

  useEffect(() => {
    if (res.ok) alGuardar();
    // Solo reacciona al resultado de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  function generar() {
    setSecreto(generarPasswordNavegador(16));
    setVisible(true);
  }

  return (
    <form action={accion} className="space-y-4">
      <div>
        <h2 className="text-base font-medium text-slate-900">{editando ? "Editar credencial" : "Nueva credencial"}</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          {editando ? "Deja la contraseña vacía para conservar la actual." : "La contraseña se guarda cifrada; solo se verá al pulsar «Revelar»."}
        </p>
      </div>
      <input type="hidden" name="aplicacion_id" value={aplicacionId} />
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="etiqueta" className="label">Para qué es</label>
          <input
            id="etiqueta"
            name="etiqueta"
            required
            maxLength={120}
            autoFocus
            defaultValue={inicial?.etiqueta ?? ""}
            placeholder="Ej. Panel de administración"
            aria-invalid={errores.etiqueta ? true : undefined}
            className="input mt-1"
          />
          <Error msj={errores.etiqueta} />
        </div>

        <div>
          <label htmlFor="ambiente" className="label">Ambiente</label>
          <select id="ambiente" name="ambiente" defaultValue={inicial?.ambiente ?? "produccion"} className="input mt-1">
            {AMBIENTES.map((a) => (
              <option key={a} value={a}>{ETIQUETAS_AMBIENTE[a]}</option>
            ))}
          </select>
          <Error msj={errores.ambiente} />
        </div>

        <div>
          <label htmlFor="usuario" className="label">Usuario <span className="font-normal text-slate-500">(opcional)</span></label>
          <input
            id="usuario"
            name="usuario"
            maxLength={200}
            autoComplete="off"
            defaultValue={inicial?.usuario ?? ""}
            placeholder="admin, correo, cuenta de servicio…"
            className="input mt-1"
          />
          <Error msj={errores.usuario} />
        </div>

        <div>
          <label htmlFor="secreto" className="label">
            Contraseña o secreto{editando && <span className="font-normal text-slate-500"> (vacío = no cambia)</span>}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="secreto"
              name="secreto"
              type={visible ? "text" : "password"}
              required={!editando}
              maxLength={MAX_SECRETO}
              autoComplete="new-password"
              spellCheck={false}
              value={secreto}
              onChange={(e) => setSecreto(e.target.value)}
              placeholder={editando ? "Dejar vacío para conservar la actual" : ""}
              aria-invalid={errores.secreto ? true : undefined}
              className="input font-mono"
            />
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Ocultar" : "Mostrar"} className="btn-secondary px-2.5">
              {visible ? <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.5} /> : <Eye aria-hidden className="h-4 w-4" strokeWidth={1.5} />}
            </button>
            <button type="button" onClick={generar} title="Generar una contraseña segura" className="btn-secondary px-2.5">
              <RefreshCw aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Generar</span>
            </button>
          </div>
          <Error msj={errores.secreto} />
        </div>

        <div>
          <label htmlFor="tiene_mfa" className="label">¿Tiene MFA?</label>
          <select
            id="tiene_mfa"
            name="tiene_mfa"
            value={tieneMfa ? "si" : "no"}
            onChange={(e) => setTieneMfa(e.target.value === "si")}
            className="input mt-1"
          >
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">Segundo factor: app autenticadora, SMS o llave física.</p>
        </div>

        {tieneMfa && (
          <fieldset>
            <legend className="label">¿Quién tiene el MFA?</legend>
            {equipo.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">No hay miembros activos de Innovación.</p>
            ) : (
              <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-slate-300 p-1">
                {equipo.map((m) => (
                  <li key={m.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        name="mfa_titulares"
                        value={m.id}
                        defaultChecked={titularesIniciales.includes(m.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {m.nombre}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <Error msj={errores.mfa_titulares} />
          </fieldset>
        )}

        <div className="md:col-span-2">
          <label htmlFor="notas" className="label">Notas <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea
            id="notas"
            name="notas"
            rows={2}
            maxLength={2000}
            defaultValue={inicial?.notas ?? ""}
            placeholder="Cómo se usa, restricciones, a quién pedir acceso."
            className="input mt-1"
          />
          <Error msj={errores.notas} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {res.error && !res.ok && <p role="alert" className="mr-auto text-sm text-cobre-700">{res.error}</p>}
        <button type="button" onClick={alCancelar} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={pendiente} className="btn-primary">
          {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar credencial"}
        </button>
      </div>
    </form>
  );
}
