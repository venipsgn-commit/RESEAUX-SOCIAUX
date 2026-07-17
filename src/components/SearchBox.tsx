'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Result = {
  kind: 'person' | 'post';
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  image_url: string | null;
  avatar_url: string | null;
};

export function SearchBox() {
  const supabase = createClient();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[] | null>(null);

  async function run(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    const { data } = await supabase.rpc('search_all', { q: value.trim() });
    setResults((data ?? []) as Result[]);
  }

  const people = results?.filter((r) => r.kind === 'person') ?? [];
  const posts = results?.filter((r) => r.kind === 'post') ?? [];

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => run(e.target.value)}
        placeholder="🔍 Rechercher un voisin, une annonce…"
        className="w-full bg-white rounded-full px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
      />

      {results === null ? (
        <div className="text-center py-16 text-sm text-ink-700/50">
          Tape au moins 2 lettres pour chercher.
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-sm text-ink-700/60 font-bold">Aucun résultat.</div>
      ) : (
        <div className="mt-4 space-y-6">
          {people.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">Voisins</div>
              <div className="space-y-1">
                {people.map((r) => (
                  <Link
                    key={r.id}
                    href={`/u/${r.subtitle.replace(/^@/, '')}`}
                    className="flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-white/60"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                      {r.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.emoji
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{r.title}</div>
                      <div className="text-[11px] text-ink-700/50 truncate">{r.subtitle}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {posts.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">Publications</div>
              <div className="space-y-1">
                {posts.map((r) => (
                  <Link
                    key={r.id}
                    href={`/post/${r.id}`}
                    className="flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-white/60"
                  >
                    <div className="w-11 h-11 rounded-xl bg-sand-100 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.emoji
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{r.title}</div>
                      {r.subtitle && <div className="text-[11px] text-ink-700/50 truncate">{r.subtitle}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
