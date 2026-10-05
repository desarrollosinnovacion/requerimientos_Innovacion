"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { CLASES_AMBIENTE, ETIQUETAS_AMBIENTE, type CredencialFila } from "@/lib/credenciales";
import { formatearFecha } from "@/lib/formato";
import type { MiembroEquipo } from "@/lib/tipos";
import { eliminarCredencial } from "../actions";
import { ModalCredencial } from "./modal-credencial";
import { SecretoCredencial } from "./secreto-credencial";

type Props = { filas: CredencialFila[]; equipo: MiembroEquipo[]; deshabilitado: boolean };
const COLUMNAS = 7;

/** Tabla de credenciales de una aplicación. El secreto nunca viene en `filas`; lo pide cada fila al servidor. */
export function TablaCredenciales({ filas, equipo, deshabilitado }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Para qué es</th>
            <th className="px-4 py-3">Ambiente</th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3">Contraseña</th>
            <th className="px-4 py-3">MFA</th>
            <th className="px-4 py-3">Actualizada</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((c) => (
            <FilaCredencial key={c.id} cred={c} equipo={equipo} deshabilitado={deshabilitado} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Sí" con los nombres de quienes tienen el segundo factor, o "No". */
function Mfa({ cred }: { cred: CredencialFila }) {
  if (!cred.tiene_mfa) return <span className="text-xs text-slate-400">No</span>;
  const nombres = cred.mfa_titulares.map((t) => t.perfil?.nombre).filter(Boolean) as string[];
  return (
    <div>
      <span className="inline-flex rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Sí</span>
      <p className="mt-1 max-w-48 text-xs text-slate-600">
        {nombres.length > 0 ? nombres.join(", ") : <span className="text-cobre-700">Nadie señalado</span>}
      </p>
    </div>
  );
}

function FilaCredencial({ cred, equipo, deshabilitado }: { cred: CredencialFila; equipo: MiembroEquipo[]; deshabilitado: boolean }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function eliminar() {
    setError(null);
    startTransition(async () => {
      const r = await eliminarCredencial(cred.id);
      if (!r.ok) setError(r.error);
      else setConfirmando(false);
    });
  }

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <p className="font-medium text-slate-900">{cred.etiqueta}</p>
          {cred.notas && <p className="mt-0.5 max-w-xs whitespace-pre-line text-xs text-slate-500">{cred.notas}</p>}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_AMBIENTE[cred.ambiente]}`}>
            {ETIQUETAS_AMBIENTE[cred.ambiente]}
          </span>
        </td>
        <td className="px-4 py-3">
          {cred.usuario ? <Usuario valor={cred.usuario} /> : <span className="text-xs text-slate-400">—</span>}
        </td>
        <td className="px-4 py-3">
          <SecretoCredencial id={cred.id} deshabilitado={deshabilitado} />
        </td>
        <td className="px-4 py-3">
          <Mfa cred={cred} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatearFecha(cred.actualizado_en)}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <ModalCredencial aplicacionId={cred.aplicacion_id} equipo={equipo} inicial={cred} />
          <button type="button" onClick={() => setConfirmando((v) => !v)} className="rounded px-2 py-1 text-xs text-cobre-600 hover:bg-cobre-50">
            Eliminar
          </button>
        </td>
      </tr>
      {(confirmando || error) && (
        <tr className="bg-slate-50">
          <td colSpan={COLUMNAS} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {confirmando && (
                <>
                  <span className="text-sm text-cobre-800">¿Eliminar la credencial «{cred.etiqueta}»? No se puede deshacer; la bitácora conserva el registro.</span>
                  <button
                    type="button"
                    onClick={eliminar}
                    disabled={pendiente}
                    className="rounded-md bg-cobre-600 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-cobre-700 disabled:opacity-60"
                  >
                    {pendiente ? "Eliminando…" : "Sí, eliminar"}
                  </button>
                  <button type="button" onClick={() => setConfirmando(false)} className="btn-secondary px-3 py-1.5">Cancelar</button>
                </>
              )}
              {error && <p role="alert" className="text-sm text-cobre-700">{error}</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Usuario en texto plano (no es secreto) con botón para copiarlo. */
function Usuario({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El texto se puede seleccionar a mano.
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="select-all rounded bg-slate-50 px-2 py-1 font-mono text-sm text-slate-900 ring-1 ring-slate-200">{valor}</code>
      <button type="button" onClick={copiar} aria-label={`Copiar usuario ${valor}`} title={copiado ? "Copiado" : "Copiar"} className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900">
        <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      {copiado && <span className="text-xs text-brand-800">Copiado</span>}
    </span>
  );
}
