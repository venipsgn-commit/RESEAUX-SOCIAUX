'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSession } from '@/lib/store';

export default function LoginPage() {
    const router = useRouter();
    const setSession = useSession((s) => s.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res: any = await api.login({ email, password });
            const facets: any = await api.listFacets(res.token);
            setSession(res.token, res.user, facets);
            router.push('/feed');
        } catch (err: any) {
            setError(err.message || 'Identifiants invalides');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-nexus-50 to-nexus-100 px-6">
            <form onSubmit={submit} className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl space-y-4">
                <h1 className="text-3xl font-bold text-nexus-900">Connexion</h1>

                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg outline-none focus:ring-2 focus:ring-nexus-500"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Mot de passe</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg outline-none focus:ring-2 focus:ring-nexus-500"
                    />
                </label>

                {error && <p className="text-rose-600 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-nexus-600 text-white rounded-full hover:bg-nexus-700 disabled:opacity-50"
                >
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>

                <p className="text-center text-sm text-gray-600">
                    Pas encore de compte ?{' '}
                    <Link href="/signup" className="text-nexus-600 hover:underline">
                        Rejoindre NEXUS
                    </Link>
                </p>
            </form>
        </main>
    );
}
