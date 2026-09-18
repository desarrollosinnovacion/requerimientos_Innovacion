import { requerirUsuario } from "@/lib/auth";
import { cargarCatalogos } from "@/lib/catalogos";
import { ElementoCatalogo } from "../elemento-catalogo";
import { FormNuevo } from "../form-nuevo";
import { EncabezadoCatalogo, Vacio } from "../encabezado-catalogo";

export default async function EmpresasPage() {
  const { supabase } = await requerirUsuario();
  const empresas = await cargarCatalogos(supabase, false);

  return (
    <div className="space-y-6">
      <EncabezadoCatalogo
        titulo="Empresas"
        descripcion="Primer nivel del catálogo. Haz clic en una empresa para ver sus departamentos."
      />
      <div className="card space-y-4 p-5">
        <FormNuevo nivel="empresas" placeholder="Nombre de la nueva empresa" />
        {empresas.length === 0 ? (
          <Vacio>Sin empresas todavía. Agrega la primera arriba.</Vacio>
        ) : (
          <ul className="space-y-2">
            {empresas.map((e) => (
              <ElementoCatalogo
                key={e.id}
                nivel="empresas"
                id={e.id}
                nombre={e.nombre}
                activo={e.activo}
                href={`/configuracion/catalogos/departamentos?empresa=${e.id}`}
                conteoHijos={e.departamentos.length}
                etiquetaHijos="departamentos"
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
