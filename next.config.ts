import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts makes Next buffer request bodies, by default only up to
    // 10 MB -- larger phone photos (and their base64 cutouts) would be
    // cut off. Covers MAX_UPLOAD_BYTES (25 MB) plus base64 overhead.
    proxyClientMaxBodySize: "40mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Don't let other sites frame Wardro (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          // Camera (adding pieces) and location (weather) are the only
          // device features Wardro uses.
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
