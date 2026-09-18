import { requerirUsuario } from "@/lib/auth";
import { Migas } from "@/components/migas";
import type { Perfil } from "@/lib/tipos";
import { formatearFecha } from "@/lib/formato";
import { FormNuevoUsuario } from "./form-nuevo-usuario";
import { FilaUsuario } from "./fila-usuario";

type PerfilLista = Perfil & { creado_en: string };

export default async function UsuariosPage() {
  const { supabase, perfil: yo } = await requerirUsuario();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, rol, activo, debe_cambiar_password, creado_en")
    .order("creado_en", { ascending: false })
    .returns<PerfilLista[]>();
  const usuarios = data ?? [];
  const faltaClave = !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div className="space-y-6">
      <Migas items={[{ href: "/configuracion", etiqueta: "Configuración" }, { etiqueta: "Usuarios" }]} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Las cuentas las crea el equipo de Innovación; no existe registro público. El sistema genera una
          contraseña temporal que el usuario debe cambiar al entrar por primera vez.
        </p>
      </div>

      {faltaClave && (
        <p role="alert" className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Falta la variable <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> en el servidor. Sin ella no
          se pueden crear ni administrar usuarios. Cópiala de Supabase → Project Settings → API → service_role.
        </p>
      )}

      <section className="card p-5" aria-labelledby="nuevo-usuario">
        <h2 id="nuevo-usuario" className="text-base font-semibold text-slate-900">Nuevo usuario</h2>
        <FormNuevoUsuario deshabilitado={faltaClave} />
      </section>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          No fue posible cargar los usuarios: {error.message}
        </p>
      )}

      <section className="card overflow-x-auto" aria-label="Lista de usuarios">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <FilaUsuario
                key={u.id}
                usuario={u}
                esYo={u.id === yo.id}
                creado={formatearFecha(u.creado_en)}
                deshabilitado={faltaClave}
              />
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay usuarios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
