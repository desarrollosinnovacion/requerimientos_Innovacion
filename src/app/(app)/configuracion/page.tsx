import { TarjetaEnlace } from "@/components/tarjeta-enlace";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600">Ajustes del portal administrados por el equipo de Innovación.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaEnlace
          href="/configuracion/catalogos"
          icono="🗂️"
          titulo="Catálogos"
          descripcion="Empresas, departamentos y áreas que se usan en el formulario de requerimientos."
        />
        <TarjetaEnlace
          href="/configuracion/usuarios"
          icono="👥"
          titulo="Usuarios"
          descripcion="Crea las cuentas de acceso, asigna roles y restablece contraseñas."
        />
      </div>
    </div>
  );
}
