// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**/*': ['./prisma/**/*'],
  },
};

export default nextConfig;