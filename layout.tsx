// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'World Connect',
  description: 'Connectez-vous avec le monde entier',
  manifest: '/manifest.json',
  icons: {
    icon: '/connect_pro.png',
    apple: '/connect_pro.png',
  },
  themeColor: '#8b9556',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}

        {/* Service Worker — enregistré une seule fois ici */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(reg) {
                      console.log('✅ Service Worker enregistré:', reg.scope);
                    })
                    .catch(function(err) {
                      console.error('❌ Erreur Service Worker:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
