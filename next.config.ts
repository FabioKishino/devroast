import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["postgres", "@node-rs/argon2", "@node-rs/bcrypt"],
};

export default nextConfig;
