import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { ElementoCatalogo } from "../elemento-catalogo";
import { FormNuevo } from "../form-nuevo";
import { FiltroCatalogo } from "../filtro-catalogo";
import { EncabezadoCatalogo, Vacio } from "../encabezado-catalogo";

export default async function AreasPage(props: PageProps<"/configuracion/catalogos/areas">) {
  const { empresa: empresaParam, departamento: deptoParam } = await props.searchParams;
  const { supabase } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, false);
  const empresa = empresas.find((e) => e.id === empresaParam) ?? empresas[0] ?? null;
  const departamento =
    empresa?.departamentos.find((d) => d.id === deptoParam) ?? empresa?.departamentos[0] ?? null;

  return (
    <div className="space-y-6">
      <EncabezadoCatalogo
        titulo="Áreas"
        descripcion="Tercer nivel del catálogo, opcional. Elige empresa y departamento para administrar sus áreas."
      />
      {empresas.length === 0 ? (
        <Vacio>
          Primero registra una empresa en{" "}
          <Link href="/configuracion/catalogos/empresas" className="font-medium text-brand-600 hover:underline">Empresas</Link>.
        </Vacio>
      ) : (
        <div className="card space-y-4 p-5">
          <div className="flex flex-wrap gap-3">
            <FiltroCatalogo nombre="empresa" etiqueta="Empresa" opciones={empresas} valor={empresa?.id ?? ""} limpiar={["departamento"]} />
            {empresa && (
              <FiltroCatalogo
                nombre="departamento"
                etiqueta="Departamento"
                opciones={empresa.departamentos}
                valor={departamento?.id ?? ""}
              />
            )}
          </div>
          {empresa && empresa.departamentos.length === 0 && (
            <Vacio>
              {empresa.nombre} no tiene departamentos. Agrégalos en{" "}
              <Link href={`/configuracion/catalogos/departamentos?empresa=${empresa.id}`} className="font-medium text-brand-600 hover:underline">
                Departamentos
              </Link>.
            </Vacio>
          )}
          {departamento && (
            <>
              <FormNuevo nivel="areas" padreId={departamento.id} placeholder={`Nueva área de ${departamento.nombre}`} />
              {departamento.areas.length === 0 ? (
                <Vacio>{departamento.nombre} no tiene áreas. Si no aplica, puedes dejarlo así.</Vacio>
              ) : (
                <ul className="space-y-2">
                  {departamento.areas.map((a) => (
                    <ElementoCatalogo key={a.id} nivel="areas" id={a.id} nombre={a.nombre} activo={a.activo} />
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
