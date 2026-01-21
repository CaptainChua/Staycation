import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
    ],
  },

  experimental: {
    optimizeCss: true,
  },

  compiler: {
    removeConsole: true,
  },
 
  eslint: {
    ignoreDuringBuilds: true, // Add this line
  },
  /* other config options */
  typescript: {
    ignoreBuildErrors: true, // Add this line
  },

};

export default nextConfig;