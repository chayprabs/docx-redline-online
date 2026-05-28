import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@docx-redline/shared-ui", "@docx-redline/shared-types"],
};

export default nextConfig;
