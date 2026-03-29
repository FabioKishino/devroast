import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: [
    "postgres",
    "@node-rs/argon2",
    "@node-rs/bcrypt",
    "@takumi-rs/core",
  ],
};

export default nextConfig;
