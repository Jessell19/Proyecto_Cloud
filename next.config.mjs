/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // imagen Docker pequeña para Cloud Run
  poweredByHeader: false,
  images: { unoptimized: true }, // la app no usa el optimizador de imágenes (menos superficie de ataque)
};
export default nextConfig;
