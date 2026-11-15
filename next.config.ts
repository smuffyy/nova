import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // Electron loads the UI from 127.0.0.1 while Next serves as localhost
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
