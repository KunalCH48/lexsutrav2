import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "lexsutra.eu" }],
        destination: "https://lexsutra.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lexsutra.eu" }],
        destination: "https://lexsutra.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "lexsutra.nl" }],
        destination: "https://lexsutra.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lexsutra.nl" }],
        destination: "https://lexsutra.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
