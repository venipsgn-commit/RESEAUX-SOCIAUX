'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSession } from '@/lib/store';
import { Composer } from '@/components/Composer';
import { PostCard } from '@/components/PostCard';

export default function FeedPage() {
    const router = useRouter();
    const { token, user, facets, activeFacetId } = useSession();
    const [posts, setPosts] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        async function load() {
            try {
                if (activeFacetId) {
                    const feed: any = await api.getFeed(token!, activeFacetId);
                    setPosts(feed.items || []);
                }
                const w: any = await api.getWallet(token!);
                setWallet(w);
            } catch (_) {
                /* ignore */
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [token, activeFacetId, router]);

    if (!token) return null;

    const balanceEur = wallet ? (wallet.balance_cents / 100).toFixed(2) : '0.00';

    return (
        <main className="min-h-screen bg-nexus-50 dark:bg-black">
            <header className="border-b border-nexus-100 dark:border-nexus-700 bg-white dark:bg-nexus-900">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-3xl">
                    <h1 className="text-xl font-bold text-nexus-600">NEXUS</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            💰 <strong>{balanceEur} €</strong>
                        </div>
                        <span className="text-sm text-gray-600">{user?.email}</span>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
                <Composer />

                {loading && <p className="text-center text-gray-500 py-8">Chargement du feed…</p>}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">👋 Bienvenue sur NEXUS !</p>
                        <p className="text-sm">
                            Ton feed est vide. Publie ta première pensée ou suis quelques personnes pour le remplir.
                        </p>
                    </div>
                )}

                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </main>
    );
}
