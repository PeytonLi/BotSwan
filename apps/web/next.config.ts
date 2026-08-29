import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@botswan/shared", "@botswan/agent", "@botswan/artifacts"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
