import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El PDF del requerimiento lee fuentes y logo de /public con fs; hay que incluirlos en el bundle de la función.
  outputFileTracingIncludes: {
    "/requerimientos/[id]/pdf": ["./public/fuentes/*.ttf", "./public/marca/logo-verde.png"],
  },
};

export default nextConfig;
