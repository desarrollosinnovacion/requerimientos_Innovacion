# INN Requerimientos

Portal para que las áreas de la empresa envíen requerimientos de desarrollo al Departamento de Innovación.

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Supabase**: autenticación, base de datos Postgres con RLS y Storage para adjuntos
- **Vercel**: despliegue

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com/dashboard> y crea un proyecto nuevo.
2. Ve a **SQL Editor** y ejecuta, en orden, cada archivo de `supabase/migrations/` (`0001_init.sql`, `0002_catalogos.sql`, … hasta la última numerada).
3. En **Authentication → URL Configuration** agrega:
   - Site URL: `http://localhost:3000` (y luego la URL de Vercel)
   - Redirect URLs: `http://localhost:3000/auth/callback` y `https://TU-APP.vercel.app/auth/callback`
4. En **Authentication → Sign In / Providers** desactiva **Confirm email** y también **Allow new users to sign up**. No hay registro público: las cuentas se crean desde Configuración → Usuarios.
5. Copia **Project Settings → API → Project URL**, **anon public key** y **service_role key** (esta última es secreta; solo se usa en el servidor).

## 2. Correr en local

```bash
cp .env.example .env.local   # pega la URL y la anon key
npm install
npm run dev
```

## 3. Primer usuario de Innovación

Como no hay registro público, el primer usuario se crea desde el panel de Supabase: **Authentication → Users → Add user** (marca "Auto Confirm User"). Luego dale el rol de Innovación en el SQL Editor:

```sql
update public.perfiles set rol = 'innovacion' where correo = 'persona@empresa.com';
```

A partir de ahí, ese usuario crea a los demás desde **Configuración → Usuarios** dentro de la app. El sistema genera una contraseña temporal (se muestra una sola vez) y el usuario debe cambiarla al entrar. Desde la misma pantalla se puede reiniciar la contraseña, desactivar/activar y eliminar usuarios.

## 4. Desplegar en Vercel

1. Sube el repo a GitHub y en <https://vercel.com/new> importa el proyecto.
2. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. Después agrega la URL final de Vercel en Supabase (paso 1.3).

## Estructura

```
supabase/migrations/0001_init.sql   Esquema, RLS, folio automático, bucket de adjuntos
supabase/migrations/0002_catalogos.sql  Catálogos empresas -> departamentos -> áreas
supabase/migrations/0003_usuarios.sql   Cambio obligatorio de contraseña y desactivación de usuarios
supabase/migrations/0004_estado_proyecto.sql  Estados del proyecto (versión anterior, 4 estados)
supabase/migrations/0011_estados_proyecto_v3.sql  Estados actuales (Pausado, Recurrente, No iniciado, En desarrollo, Casi terminado, En pruebas, Entregado)
supabase/migrations/0005_equipo_asignado.sql  Equipo de Innovación asignado a cada requerimiento
src/lib/formulario.ts               Definición del formulario (secciones, campos, opciones, validación)
src/lib/catalogos.ts                Carga de catálogos como árbol
src/app/(app)/configuracion         Módulo Configuración (solo rol innovacion): Catálogos, Usuarios
src/lib/supabase/admin.ts           Cliente service_role para administrar usuarios (solo servidor)
src/lib/supabase/                   Clientes de Supabase (servidor, navegador, proxy de sesión)
src/proxy.ts                        Protege rutas: redirige a /login sin sesión
src/app/login                       Inicio de sesión (sin registro público)
src/app/(app)/page.tsx              Dashboard de inicio (estados, carga del equipo, vencimientos, actividad)
src/app/(app)/requerimientos        Lista, formulario nuevo y detalle
```

## Roles

| Rol           | Puede                                                              |
|---------------|--------------------------------------------------------------------|
| `solicitante` | Crear requerimientos, ver los suyos, adjuntar archivos             |
| `innovacion`  | Ver todos, cambiar el estado del proyecto (Pausado, Recurrente, No iniciado, En desarrollo, Casi terminado, En pruebas, Entregado), asignar miembros del equipo, prioridad final, fecha estimada y notas, administrar catálogos y usuarios en Configuración |

Las reglas se aplican en la base de datos (Row Level Security), no solo en la interfaz.
