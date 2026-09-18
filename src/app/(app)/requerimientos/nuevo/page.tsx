import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { FormularioRequerimiento } from "./formulario-requerimiento";

export default async function NuevoRequerimiento() {
  const { supabase, perfil } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, true);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/requerimientos" className="text-sm text-slate-500 hover:text-slate-800">
          ← Volver a la lista
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Requerimiento de desarrollo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Utiliza este formulario para solicitar nuevos desarrollos, mejoras, automatizaciones,
          integraciones, reportes o soluciones de datos. Los campos marcados con{" "}
          <span className="text-red-600">*</span> son obligatorios.
        </p>
      </div>
      <FormularioRequerimiento
        valoresIniciales={{ nombre_solicitante: perfil.nombre, correo: perfil.correo }}
        empresas={empresas}
      />
    </div>
  );
}
