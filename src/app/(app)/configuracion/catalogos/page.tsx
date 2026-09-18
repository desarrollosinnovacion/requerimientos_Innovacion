import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { Migas } from "@/components/migas";
import { TarjetaEnlace } from "@/components/tarjeta-enlace";
import { Building2, Network, Layers } from "lucide-react";

export default async function CatalogosPage() {
  const { supabase } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, false);
  const departamentos = empresas.flatMap((e) => e.departamentos);
  const areas = departamentos.flatMap((d) => d.areas);

  return (
    <div className="space-y-6">
      <Migas items={[{ href: "/configuracion", etiqueta: "Configuración" }, { etiqueta: "Catálogos" }]} />
      <div>
        <h1 className="text-2xl font-medium text-slate-900">Catálogos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cada empresa tiene departamentos y cada departamento puede tener áreas. Los elementos inactivos
          no se muestran a los solicitantes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaEnlace
          href="/configuracion/catalogos/empresas"
          icono={Building2}
          titulo="Empresas"
          descripcion="Primer nivel. Cada empresa agrupa sus departamentos."
          detalle={`${empresas.length} registradas`}
        />
        <TarjetaEnlace
          href="/configuracion/catalogos/departamentos"
          icono={Network}
          titulo="Departamentos"
          descripcion="Segundo nivel. Pertenecen a una empresa."
          detalle={`${departamentos.length} registrados`}
        />
        <TarjetaEnlace
          href="/configuracion/catalogos/areas"
          icono={Layers}
          titulo="Áreas"
          descripcion="Tercer nivel, opcional. Pertenecen a un departamento."
          detalle={`${areas.length} registradas`}
        />
      </div>
    </div>
  );
}
