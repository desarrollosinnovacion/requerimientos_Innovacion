import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { LogoSicsa } from "@/components/logo-sicsa";

export const metadata: Metadata = { title: "Requerimiento enviado · Innovación" };

export default async function SolicitudEnviada(props: PageProps<"/solicitud/enviado">) {
  const { folio } = await props.searchParams;
  const folioTexto = typeof folio === "string" && /^REQ-\d{4}-\d{4}$/.test(folio) ? folio : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <LogoSicsa variante="verde" ancho={150} />
        <div className="regla mt-6" />
        <CheckCircle2 aria-hidden className="mt-8 h-10 w-10 text-brand-600" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-medium text-slate-900">Requerimiento enviado</h1>
        {folioTexto && (
          <p className="mt-3 text-sm text-slate-600">
            Tu folio es <code className="select-all rounded bg-slate-100 px-2 py-1 font-mono text-base text-slate-900">{folioTexto}</code>
          </p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          El Departamento de Innovación lo evaluará y te contactará al correo que indicaste.
          Guarda el folio para cualquier consulta.
        </p>
        <Link href="/solicitud" className="btn-secondary mt-6">Enviar otro requerimiento</Link>
      </div>
    </main>
  );
}
