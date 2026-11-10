import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Browser calls same-origin /api/*; Next forwards them to the NestJS API. No secrets reach the browser.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
      // Health lives outside /api/v1 on the API (version-neutral); /diagnostics reads it here.
      { source: "/api/health", destination: `${apiUrl}/api/health` },
      { source: "/api/health/:path*", destination: `${apiUrl}/api/health/:path*` },
    ];
  },
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/pitch-studio",
        permanent: false,
      },
      {
        source: "/lead-hunter",
        destination: "/pitch-studio",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
