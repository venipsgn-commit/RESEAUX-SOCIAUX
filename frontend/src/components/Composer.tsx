'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/store';
import { CircleSelector } from './CircleSelector';
import { CarbonBadge } from './CarbonBadge';

export function Composer() {
    const { token, activeFacetId } = useSession();
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState(5);
    const [timeCapsule, setTimeCapsule] = useState<string>('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const estimatedCarbon = content.length > 0 ? 0.2 : 0;

    async function submit() {
        if (!token || !activeFacetId || !content.trim()) return;
        setPosting(true);
        setError(null);
        try {
            await api.createPost(token, {
                facetId: activeFacetId,
                content: content.trim(),
                visibility,
                timeCapsuleAt: timeCapsule ? new Date(timeCapsule).toISOString() : undefined,
            });
            setContent('');
            setTimeCapsule('');
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la publication');
        } finally {
            setPosting(false);
        }
    }

    return (
        <div className="p-4 border border-nexus-100 rounded-2xl bg-white dark:bg-nexus-900/40 dark:border-nexus-700">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Quoi de neuf dans ton univers ?"
                maxLength={5000}
                className="w-full p-3 rounded-xl bg-nexus-50 dark:bg-nexus-900 resize-none focus:outline-none focus:ring-2 focus:ring-nexus-500"
                rows={3}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <CircleSelector value={visibility} onChange={setVisibility} />
                <input
                    type="datetime-local"
                    value={timeCapsule}
                    onChange={(e) => setTimeCapsule(e.target.value)}
                    title="Time-Capsule : date de révélation"
                    className="px-2 py-1 text-sm rounded-lg border border-nexus-200 dark:border-nexus-700 bg-transparent"
                />
                <CarbonBadge grams={estimatedCarbon} />
                <div className="flex-1" />
                <span className="text-xs text-gray-500">{content.length}/5000</span>
                <button
                    onClick={submit}
                    disabled={!content.trim() || posting}
                    className="px-4 py-2 rounded-full bg-nexus-600 text-white disabled:opacity-40 hover:bg-nexus-700"
                >
                    {posting ? 'Publication…' : 'Publier'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </div>
    );
}
