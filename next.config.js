/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  images: {
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com'],
  },
};

module.exports = nextConfig;
