import Link from "next/link";

export default function NoEncontrada() {
  return (
    <div className="card mx-auto max-w-md p-10">
      <h1 className="text-lg font-semibold text-slate-900">Aplicación no encontrada</h1>
      <p className="mt-2 text-sm text-slate-600">No existe o no tienes acceso a esta aplicación.</p>
      <Link href="/credenciales" className="btn-secondary mt-6">Volver a la lista</Link>
    </div>
  );
}
