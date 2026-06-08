/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/fks-creative-cloud',
  assetPrefix: '/fks-creative-cloud',
}

module.exports = nextConfig
