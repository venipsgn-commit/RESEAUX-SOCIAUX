import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
    title: 'NEXUS — Le réseau social à économie inversée',
    description:
        'NEXUS reverse 70% de ses revenus publicitaires à ses utilisateurs. Identités fragmentées, time-capsules, marketplace P2P, crisis support. Le réseau social que personne n\'a osé construire.',
    metadataBase: new URL('https://nexus.social'),
    openGraph: {
        title: 'NEXUS — Le réseau social à économie inversée',
        description: 'Reconnectons l\'humain au-dessus du profit.',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body>{children}</body>
        </html>
    );
}
