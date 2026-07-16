/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "miracle-masters-aside-pearl.trycloudflare.com",
  ],
  images: {
    qualities: [75, 100],
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
}

module.exports = nextConfig
