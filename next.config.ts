import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ Active le App Router (activé par défaut en Next.js 14)
  // ✅ Pas besoin de vercel.json pour le routing — Next.js le gère nativement

  // Optimisation des images
  images: {
    remotePatterns: [
      {
        // ✅ Autorise les images venant de Supabase Storage
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ✅ Three.js nécessite d'être traité côté client uniquement
  // On le déclare comme package externe pour éviter les erreurs SSR
  experimental: {
    // Permet d'importer Three.js dans les composants client
  },

  // ✅ Headers de sécurité + autoriser le service worker
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
