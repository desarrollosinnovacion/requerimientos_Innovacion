"use client";

import { useState } from "react";
import type { Empresa } from "@/lib/catalogos";

type Props = { empresas: Empresa[]; error?: string; errorId?: string };

export function SelectorEmpresaArea({ empresas, error, errorId }: Props) {
  const [empresaId, setEmpresaId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");

  const empresa = empresas.find((e) => e.id === empresaId);
  const departamentos = empresa?.departamentos ?? [];
  const departamento = departamentos.find((d) => d.id === departamentoId);
  const areas = departamento?.areas ?? [];
  const clase = `input mt-1 ${error ? "border-red-400" : ""}`;

  if (empresas.length === 0) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Aún no hay empresas registradas en el catálogo. Pide al equipo de Innovación que las configure.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-describedby={errorId}>
      <div>
        <label htmlFor="empresa_id" className="label">Empresa<Req /></label>
        <select
          id="empresa_id"
          name="empresa_id"
          value={empresaId}
          onChange={(e) => { setEmpresaId(e.target.value); setDepartamentoId(""); }}
          className={clase}
          aria-required
        >
          <option value="">Selecciona…</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="departamento_id" className="label">Departamento<Req /></label>
        <select
          id="departamento_id"
          name="departamento_id"
          value={departamentoId}
          onChange={(e) => setDepartamentoId(e.target.value)}
          disabled={!empresaId}
          className={clase}
          aria-required
        >
          <option value="">{empresaId ? "Selecciona…" : "Elige una empresa"}</option>
          {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
        {empresaId && departamentos.length === 0 && (
          <p className="mt-1 text-xs text-amber-700">Esta empresa no tiene departamentos registrados.</p>
        )}
      </div>
      <div>
        <label htmlFor="area_id" className="label">
          Área{areas.length > 0 ? <Req /> : <span className="font-normal text-slate-400"> (no aplica)</span>}
        </label>
        <select
          id="area_id"
          name="area_id"
          key={departamentoId}
          defaultValue=""
          disabled={areas.length === 0}
          className={clase}
          aria-required={areas.length > 0 || undefined}
        >
          <option value="">{areas.length > 0 ? "Selecciona…" : "Sin áreas"}</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>
    </div>
  );
}

function Req() {
  return <span className="ml-1 text-red-600" aria-hidden>*</span>;
}
