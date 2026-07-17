import type { Metadata, Viewport } from 'next';
import { Inter, Caveat } from 'next/font/google';
import '../styles/globals.css';
import { PwaSetup } from '@/components/PwaSetup';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'AURA — Le réseau social de ton quartier',
  description:
    'AURA n\'affiche que ce qui est dans ton rayon de 500m. Tes voisins, leurs ventes, leurs services, leurs événements. Le reste du monde n\'existe pas.',
  metadataBase: new URL('https://aura.social'),
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AURA' },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'AURA',
    description: 'Ton quartier, enfin vivant.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#fdfaf5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${caveat.variable}`}>
      <body className="font-sans bg-cream-50">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('aura_theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
