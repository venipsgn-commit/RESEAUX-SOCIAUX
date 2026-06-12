import Link from 'next/link';

const features = [
    {
        emoji: '💰',
        title: 'Économie inversée',
        desc: '70% des revenus publicitaires reversés aux utilisateurs. Vous êtes payé, pas exploité.',
    },
    {
        emoji: '🎭',
        title: 'Identités fragmentées',
        desc: 'Une seule app pour vos vies pro, perso, créative, anonyme — chacune avec sa propre identité.',
    },
    {
        emoji: '⏳',
        title: 'Time-Capsules',
        desc: 'Publiez des messages qui s\'ouvriront dans 1 jour, 1 an ou 10 ans. Le futur dialogue avec le présent.',
    },
    {
        emoji: '🫂',
        title: 'Crisis Detection',
        desc: 'IA + humains pour détecter la détresse psychologique et offrir un vrai accompagnement.',
    },
    {
        emoji: '🌱',
        title: 'Empreinte carbone visible',
        desc: 'Chaque action montre son coût écologique. Soyez conscient de votre impact.',
    },
    {
        emoji: '🔵',
        title: 'Cercles concentriques',
        desc: 'Partagez avec qui vous voulez : intime, proches, amis, connaissances, public.',
    },
    {
        emoji: '🛒',
        title: 'Marketplace P2P intégré',
        desc: 'Achetez et vendez directement, sans intermédiaire abusif. 5–15% de commission max.',
    },
    {
        emoji: '🎨',
        title: 'Tokens créateurs',
        desc: 'Monétisez votre audience avec votre propre token. Le Web3 sans la complexité.',
    },
    {
        emoji: '⏰',
        title: 'Mode Vraie Vie',
        desc: '30 min/jour par défaut, débloquable en créant du contenu utile. Reprenez le contrôle.',
    },
];

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-nexus-50 via-white to-nexus-100 dark:from-nexus-900 dark:via-black dark:to-nexus-900">
            <header className="container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="text-2xl font-bold text-nexus-600">NEXUS</div>
                <nav className="flex gap-4">
                    <Link href="/login" className="text-nexus-700 dark:text-nexus-100 hover:underline">
                        Se connecter
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2 bg-nexus-600 text-white rounded-full hover:bg-nexus-700 transition"
                    >
                        Rejoindre
                    </Link>
                </nav>
            </header>

            <section className="container mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-nexus-900 dark:text-white">
                    Le premier réseau social
                    <br />
                    <span className="text-nexus-600">qui vous paye</span>.
                </h1>
                <p className="mt-6 text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                    NEXUS reverse <strong>70%</strong> de ses revenus publicitaires aux utilisateurs.
                    <br />
                    Identités fragmentées, Time-Capsules, marketplace P2P, crisis support.
                    <br />
                    <span className="text-nexus-600 font-semibold">Reconnectons l'humain au-dessus du profit.</span>
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/signup"
                        className="px-8 py-4 bg-nexus-600 text-white text-lg rounded-full hover:bg-nexus-700 transition shadow-lg"
                    >
                        Créer mon compte (gratuit)
                    </Link>
                    <Link
                        href="/manifesto"
                        className="px-8 py-4 border-2 border-nexus-600 text-nexus-600 text-lg rounded-full hover:bg-nexus-50 transition"
                    >
                        Lire le manifeste
                    </Link>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    Conçu pour 4 milliards d'utilisateurs · 100% RGPD · Code open-source AGPL-3.0
                </p>
            </section>

            <section className="container mx-auto px-6 py-20">
                <h2 className="text-4xl font-bold text-center mb-12 text-nexus-900 dark:text-white">
                    Ce qui n'a jamais existé
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="p-6 rounded-2xl bg-white dark:bg-nexus-900/40 border border-nexus-100 dark:border-nexus-700 hover:shadow-xl transition"
                        >
                            <div className="text-4xl mb-3">{f.emoji}</div>
                            <h3 className="text-xl font-semibold mb-2 text-nexus-900 dark:text-white">
                                {f.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold mb-6 text-nexus-900 dark:text-white">
                    Combien pourriez-vous gagner ?
                </h2>
                <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-nexus-500 to-nexus-700 text-white shadow-2xl">
                    <p className="text-6xl font-bold">~165€/an</p>
                    <p className="mt-2 text-lg opacity-90">
                        Revenu moyen estimé pour un utilisateur actif (8 pubs/jour × 70% partage).
                    </p>
                    <p className="mt-1 text-sm opacity-75">
                        Les créateurs et power-users peuvent gagner bien plus via tokens & marketplace.
                    </p>
                </div>
            </section>

            <footer className="container mx-auto px-6 py-10 text-center text-sm text-gray-500">
                <p>NEXUS · Code open-source · AGPL-3.0</p>
                <p className="mt-2">
                    <Link href="/manifesto" className="hover:underline">Manifeste</Link>
                    {' · '}
                    <Link href="/architecture" className="hover:underline">Architecture</Link>
                    {' · '}
                    <Link href="/economy" className="hover:underline">Modèle économique</Link>
                </p>
            </footer>
        </main>
    );
}
