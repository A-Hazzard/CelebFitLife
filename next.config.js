/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // If client-side, don't polyfill Node modules
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        stream: false,
        net: false,
        tls: false,
        http2: false,
        child_process: false,
        http: false,
        https: false,
        zlib: false,
        crypto: false,
        os: false,
        dns: false,
        tty: false,
        util: false,
        events: false,
        process: false,
      };
    }
    return config;
  },
  experimental: {
    externalDir: true,
    typedRoutes: true,
  },
};

module.exports = nextConfig;
