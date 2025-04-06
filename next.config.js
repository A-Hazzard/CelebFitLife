/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "**.blogspot.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
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
