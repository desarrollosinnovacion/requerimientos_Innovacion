import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { FormularioRequerimiento } from "./formulario-requerimiento";
import { crearRequerimiento } from "./actions";

export default async function NuevoRequerimiento() {
  const { supabase, perfil } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, true);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/requerimientos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Volver a la lista
        </Link>
        <h1 className="mt-2 text-2xl font-medium text-slate-900">Requerimiento de desarrollo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Utiliza este formulario para solicitar nuevos desarrollos, mejoras, automatizaciones,
          integraciones, reportes o soluciones de datos. Llena lo que tengas a la mano; ningún
          campo es obligatorio.
        </p>
      </div>
      <FormularioRequerimiento
        valoresIniciales={{ nombre_solicitante: perfil.nombre, correo: perfil.correo }}
        empresas={empresas}
        enviar={crearRequerimiento}
      />
    </div>
  );
}
