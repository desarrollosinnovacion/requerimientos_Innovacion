"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  SECCIONES,
  NOTA_FINAL,
  cumpleCondicion,
  type Campo,
  type ValoresFormulario,
} from "@/lib/formulario";
import type { Empresa } from "@/lib/catalogos";
import { crearRequerimiento } from "./actions";
import { SelectorEmpresaArea } from "./selector-empresa-area";

type Props = {
  valoresIniciales: Record<string, string>;
  empresas: Empresa[];
};

export function FormularioRequerimiento({ valoresIniciales, empresas }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [valores, setValores] = useState<ValoresFormulario>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  // Solo seguimos radios y checkboxes: controlan condiciones y campos "Otro".
  function alCambiar(e: React.FormEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement;
    if (el.type !== "radio" && el.type !== "checkbox") return;
    const fd = new FormData(e.currentTarget);
    setValores((prev) => ({
      ...prev,
      [el.name]: el.type === "radio" ? String(fd.get(el.name) ?? "") : fd.getAll(el.name).map(String),
    }));
    if (errores[el.name]) setErrores((prev) => ({ ...prev, [el.name]: "" }));
  }

  async function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    setMensaje(null);
    iniciarTransicion(async () => {
      setProgreso("Guardando requerimiento…");
      const res = await crearRequerimiento(fd);
      if (!res.ok) {
        setErrores(res.errores);
        setMensaje(res.mensaje ?? null);
        setProgreso(null);
        const primero = Object.keys(res.errores)[0];
        if (primero) {
          form.querySelector<HTMLElement>(`[data-campo="${primero}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      router.push(`/requerimientos/${res.id}?creado=1`);
    });
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} onChange={alCambiar} noValidate className="space-y-6">
      {SECCIONES.map((seccion) => (
        <section key={seccion.id} className="card p-6" aria-labelledby={`sec-${seccion.id}`}>
          <h2 id={`sec-${seccion.id}`} className="text-lg font-semibold text-slate-900">
            {seccion.titulo}
          </h2>
          <div className="mt-5 space-y-6">
            {seccion.campos.map((campo) =>
              cumpleCondicion(campo, valores) ? (
                <CampoFormulario
                  key={campo.nombre}
                  campo={campo}
                  error={errores[campo.nombre] || (("otro" in campo && campo.otro && errores[campo.otro]) || "")}
                  valores={valores}
                  valorInicial={valoresIniciales[campo.nombre]}
                  empresas={empresas}
                />
              ) : null,
            )}
          </div>
        </section>
      ))}

      <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <strong className="font-medium text-slate-800">Nota:</strong> {NOTA_FINAL}
      </p>

      {mensaje && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{mensaje}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        {progreso && <span className="text-sm text-slate-500">{progreso}</span>}
        <button type="submit" disabled={pendiente} className="btn-primary">
          {pendiente ? "Enviando…" : "Enviar requerimiento"}
        </button>
      </div>
    </form>
  );
}

function CampoFormulario({
  campo,
  error,
  valores,
  valorInicial,
  empresas,
}: {
  campo: Campo;
  error?: string;
  valores: ValoresFormulario;
  valorInicial?: string;
  empresas: Empresa[];
}) {
  const id = `campo-${campo.nombre}`;
  const errorId = `${id}-error`;

  const etiqueta = (
    <>
      {campo.etiqueta}
      {campo.requerido && <span className="ml-1 text-red-600" aria-hidden>*</span>}
    </>
  );

  let control: React.ReactNode;

  if (campo.tipo === "empresa_area") {
    // Tres campos independientes (empresa, departamento, área) en cascada; sin título combinado.
    control = <SelectorEmpresaArea empresas={empresas} error={error} errorId={error ? errorId : undefined} />;
  } else if (campo.tipo === "radio" || campo.tipo === "checkbox") {
    const seleccion = valores[campo.nombre];
    const otroActivo = Array.isArray(seleccion) ? seleccion.includes("Otro") : seleccion === "Otro";
    control = (
      <fieldset aria-describedby={error ? errorId : undefined}>
        <legend className="label">{etiqueta}</legend>
        {campo.ayuda && <p className="mt-1 text-xs text-slate-500">{campo.ayuda}</p>}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {campo.opciones.map((op) => {
            const opId = `${id}-${op.replace(/\W+/g, "-")}`;
            return (
              <label key={op} htmlFor={opId} className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input
                  id={opId}
                  type={campo.tipo}
                  name={campo.nombre}
                  value={op}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>{op}</span>
              </label>
            );
          })}
        </div>
        {campo.otro && otroActivo && (
          <input
            type="text"
            name={campo.otro}
            placeholder="Especifica…"
            aria-label={`${campo.etiqueta}: especifica otro`}
            className="input mt-2"
            autoFocus
          />
        )}
      </fieldset>
    );
  } else {
    const comun = {
      id,
      name: campo.nombre,
      defaultValue: valorInicial,
      placeholder: campo.placeholder,
      "aria-required": campo.requerido || undefined,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
      className: `input mt-1 ${error ? "border-red-400" : ""}`,
    };
    control = (
      <>
        <label htmlFor={id} className="label">{etiqueta}</label>
        {campo.ayuda && <p className="mt-1 text-xs text-slate-500">{campo.ayuda}</p>}
        {campo.tipo === "textarea" ? (
          <textarea {...comun} rows={4} />
        ) : (
          <input {...comun} type={campo.tipo === "fecha" ? "date" : "text"} />
        )}
      </>
    );
  }

  return (
    <div data-campo={campo.nombre}>
      {control}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
