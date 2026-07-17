/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@aetherium/api-client", "@aetherium/shared-types", "@aetherium/validation"]
};

export default nextConfig;
