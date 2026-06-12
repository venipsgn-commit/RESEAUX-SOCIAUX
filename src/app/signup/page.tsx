'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSession } from '@/lib/store';

export default function SignupPage() {
    const router = useRouter();
    const setSession = useSession((s) => s.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handle, setHandle] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res: any = await api.signup({ email, password, handle, displayName });
            setSession(res.token, res.user, [res.facet]);
            router.push('/feed');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-nexus-50 to-nexus-100 px-6">
            <form
                onSubmit={submit}
                className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl space-y-4"
            >
                <h1 className="text-3xl font-bold text-nexus-900">Rejoindre NEXUS</h1>
                <p className="text-sm text-gray-600">
                    Crée ton premier <strong>facet</strong> — tu pourras en ajouter d'autres ensuite (pro, créatif, anonyme).
                </p>

                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg focus:ring-2 focus:ring-nexus-500 outline-none"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Mot de passe (10+ caractères)</span>
                    <input
                        type="password"
                        required
                        minLength={10}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg focus:ring-2 focus:ring-nexus-500 outline-none"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Handle (@pseudo)</span>
                    <input
                        type="text"
                        required
                        pattern="[a-zA-Z0-9_]+"
                        minLength={3}
                        maxLength={30}
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="marie_dupont"
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg focus:ring-2 focus:ring-nexus-500 outline-none"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Nom d'affichage</span>
                    <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Marie Dupont"
                        className="mt-1 w-full p-2 border border-nexus-200 rounded-lg focus:ring-2 focus:ring-nexus-500 outline-none"
                    />
                </label>

                {error && <p className="text-rose-600 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-nexus-600 text-white rounded-full hover:bg-nexus-700 disabled:opacity-50"
                >
                    {loading ? 'Création…' : 'Créer mon compte'}
                </button>

                <p className="text-center text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="text-nexus-600 hover:underline">
                        Se connecter
                    </Link>
                </p>
            </form>
        </main>
    );
}
