/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 's3.twcstorage.ru', 'cdn.angelamoiseenko.ru'],
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