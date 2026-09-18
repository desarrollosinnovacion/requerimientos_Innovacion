import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { ElementoCatalogo } from "../elemento-catalogo";
import { FormNuevo } from "../form-nuevo";
import { FiltroCatalogo } from "../filtro-catalogo";
import { EncabezadoCatalogo, Vacio } from "../encabezado-catalogo";

export default async function DepartamentosPage(props: PageProps<"/configuracion/catalogos/departamentos">) {
  const { empresa: empresaParam } = await props.searchParams;
  const { supabase } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, false);
  const empresa = empresas.find((e) => e.id === empresaParam) ?? empresas[0] ?? null;

  return (
    <div className="space-y-6">
      <EncabezadoCatalogo
        titulo="Departamentos"
        descripcion="Segundo nivel del catálogo. Elige la empresa y administra sus departamentos."
      />
      {empresas.length === 0 ? (
        <Vacio>
          Primero registra una empresa en{" "}
          <Link href="/configuracion/catalogos/empresas" className="font-medium text-brand-600 hover:underline">Empresas</Link>.
        </Vacio>
      ) : (
        <div className="card space-y-4 p-5">
          <FiltroCatalogo nombre="empresa" etiqueta="Empresa" opciones={empresas} valor={empresa?.id ?? ""} />
          {empresa && (
            <>
              <FormNuevo nivel="departamentos" padreId={empresa.id} placeholder={`Nuevo departamento de ${empresa.nombre}`} />
              {empresa.departamentos.length === 0 ? (
                <Vacio>{empresa.nombre} no tiene departamentos todavía.</Vacio>
              ) : (
                <ul className="space-y-2">
                  {empresa.departamentos.map((d) => (
                    <ElementoCatalogo
                      key={d.id}
                      nivel="departamentos"
                      id={d.id}
                      nombre={d.nombre}
                      activo={d.activo}
                      href={`/configuracion/catalogos/areas?empresa=${empresa.id}&departamento=${d.id}`}
                      conteoHijos={d.areas.length}
                      etiquetaHijos="áreas"
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
