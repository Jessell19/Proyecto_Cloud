/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // imagen Docker pequeña para Cloud Run
  poweredByHeader: false,
};
export default nextConfig;
