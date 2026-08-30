import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['satori', 'yoga-wasm-web', '@shuding/opentype.js', 'harfbuzzjs'],
};

export default nextConfig;
