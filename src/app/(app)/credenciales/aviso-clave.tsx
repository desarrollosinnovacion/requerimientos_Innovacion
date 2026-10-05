/** Aviso cuando el servidor no tiene la clave de cifrado: sin ella no se guardan ni se leen secretos. */
export function AvisoClave() {
  return (
    <p role="alert" className="rounded-md bg-cobre-50 px-4 py-3 text-sm text-cobre-800">
      Falta la variable <code className="font-mono">CREDENCIALES_CLAVE</code> en el servidor (o no mide 32 bytes). Sin ella no
      se pueden guardar ni revelar contraseñas; las aplicaciones sí se pueden administrar. Genérala con{" "}
      <code className="font-mono">openssl rand -base64 32</code>, ponla en <code className="font-mono">.env.local</code> y en
      Vercel, y respáldala: si se pierde, los secretos guardados no se recuperan.
    </p>
  );
}
