import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { cargarCatalogos } from "@/lib/catalogos";
import { FormularioRequerimiento } from "@/app/(app)/requerimientos/nuevo/formulario-requerimiento";
import { crearRequerimientoPublico } from "./actions";
import { LogoSicsa } from "@/components/logo-sicsa";

// Los catálogos cambian desde Configuración: leerlos en cada petición, no en el build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo requerimiento · Innovación",
  description: "Envía un requerimiento de desarrollo al Departamento de Innovación.",
};

export default async function SolicitudPublica() {
  // Los catálogos solo son legibles por usuarios autenticados (RLS); aquí se
  // leen con el cliente admin únicamente para poblar los selectores.
  const empresas = await cargarCatalogos(createAdminClient(), true);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <LogoSicsa variante="verde" ancho={150} />
          <div className="regla mt-6" />
          <p className="etiqueta mt-6 text-brand-600">Departamento de Innovación</p>
          <h1 className="mt-2 text-2xl font-medium text-slate-900">Requerimiento de desarrollo</h1>
          <p className="mt-1 text-sm text-slate-600">
            Utiliza este formulario para solicitar nuevos desarrollos, mejoras, automatizaciones,
            integraciones, reportes o soluciones de datos. Llena lo que tengas a la mano; ningún campo es
            obligatorio. Para darte seguimiento necesitamos al menos tu correo.
          </p>
        </div>
        <FormularioRequerimiento valoresIniciales={{}} empresas={empresas} enviar={crearRequerimientoPublico} publico />
        <p className=" text-xs text-slate-500">
          ¿Tienes cuenta en el portal?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">Inicia sesión</Link>{" "}
          para dar seguimiento a tus requerimientos.
        </p>
      </div>
    </main>
  );
}
