/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 's3.twcstorage.ru' },
      { protocol: 'https', hostname: 'cdn.angelamoiseenko.ru' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
    unoptimized: false
  },
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://angelamoiseenko.ru'}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig; 