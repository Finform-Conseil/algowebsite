const path = require('node:path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Keep diagnostics in development; strip noisy application console calls
    // only from production bundles while preserving console.error.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error"] }
        : false,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.casablancabourse.com",
        pathname: "/images/logos/**",
      },
    ],
  },
  async headers() {
    const logoCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=604800, stale-while-revalidate=2592000",
      },
    ];
    const logoFolders = [
      "logos-brvm",
      "logos-cse-casablanca",
      "logos-gse",
      "logos-jse",
      "logos-ngx",
      "logos-nse",
    ];

    return logoFolders.map((folder) => ({
      source: `/${folder}/:path*`,
      headers: logoCacheHeaders,
    }));
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion", "lucide-react"],
  },

  logging: {
    browserToTerminal: true,
    // 'error' — errors only (default)
    // 'warn'  — warnings and errors
    // true    — all console output
    // false   — disabled
  },
};

module.exports = withNextIntl(nextConfig);
