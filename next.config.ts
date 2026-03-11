import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* turbopack.root can suppress the lockfile warning, but currently
     causes hangs on Next.js 16.1.6 — leave unset for now. */
};

export default nextConfig;
