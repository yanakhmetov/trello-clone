// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**/*': ['./prisma/**/*'],
  },
  allowedDevOrigins: ['192.168.10.102', 'localhost', '127.0.0.1'], // добавить IP вашего компьютера
};

export default nextConfig;