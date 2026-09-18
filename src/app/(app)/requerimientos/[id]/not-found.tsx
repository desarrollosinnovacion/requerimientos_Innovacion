import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Requerimiento no encontrado</h1>
      <p className="mt-2 text-sm text-slate-600">No existe o no tienes acceso a este requerimiento.</p>
      <Link href="/requerimientos" className="btn-secondary mt-6">Volver a la lista</Link>
    </div>
  );
}
