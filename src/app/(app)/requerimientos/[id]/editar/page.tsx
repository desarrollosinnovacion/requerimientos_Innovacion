import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { todosLosCampos, type ValoresFormulario } from "@/lib/formulario";
import { tituloProyecto } from "@/lib/formato";
import { puedeEditarRequerimiento } from "@/lib/permisos";
import type { Requerimiento } from "@/lib/tipos";
import { FormularioRequerimiento } from "@/app/(app)/requerimientos/nuevo/formulario-requerimiento";
import { editarRequerimiento } from "./actions";

export default async function EditarRequerimiento(props: PageProps<"/requerimientos/[id]/editar">) {
  const { id } = await props.params;
  const { supabase, perfil } = await requerirUsuario();

  const { data: req } = await supabase.from("requerimientos").select("*").eq("id", id).maybeSingle<Requerimiento>();
  if (!req) notFound();
  if (!puedeEditarRequerimiento(perfil, req)) redirect(`/requerimientos/${id}`);

  const empresas = await cargarCatalogos(supabase, true);

  // Solo los campos del formulario (más los ids de catálogo), tal como están guardados.
  const valores: ValoresFormulario = { empresa_id: req.empresa_id, departamento_id: req.departamento_id, area_id: req.area_id };
  for (const campo of todosLosCampos()) {
    if (campo.tipo === "empresa_area") continue;
    valores[campo.nombre] = req[campo.nombre] ?? null;
    if ((campo.tipo === "radio" || campo.tipo === "checkbox") && campo.otro) valores[campo.otro] = req[campo.otro] ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/requerimientos/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Volver al requerimiento
        </Link>
        <h1 className="mt-2 text-2xl font-medium text-slate-900">Editar {tituloProyecto(req)}</h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-mono text-brand-600">{req.folio}</span> · Los cambios se guardan sobre el requerimiento
          original; el estado, la prioridad final y el equipo asignado se gestionan desde el detalle.
        </p>
      </div>
      <FormularioRequerimiento
        valoresIniciales={valores}
        empresas={empresas}
        enviar={editarRequerimiento.bind(null, id)}
        textoEnviar="Guardar cambios"
      />
    </div>
  );
}
