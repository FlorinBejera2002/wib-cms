import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.asigurari.ro',
      },
      {
        protocol: 'https',
        hostname: '**.asigurari.ro',
      },
    ],
  },
  // Payload CMS needs this
  experimental: {
    reactCompiler: false,
  },
}

export default withPayload(nextConfig)
