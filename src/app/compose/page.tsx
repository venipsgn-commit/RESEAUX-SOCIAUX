'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Shell } from '@/components/Shell';
import { ImageUpload } from '@/components/ImageUpload';
import { createClient } from '@/lib/supabase/client';
import { getClientPosition } from '@/lib/location';
import { POST_TYPE_META, type PostType } from '@/lib/types';

const TYPES: { id: PostType; icon: string; label: string }[] = [
  { id: 'sell', icon: '🛒', label: 'Vendre' },
  { id: 'service', icon: '🛠', label: 'Service' },
  { id: 'event', icon: '🎉', label: 'Event' },
  { id: 'question', icon: '💬', label: 'Question' },
  { id: 'geolock', icon: '🔮', label: 'Géo-verrou' },
  { id: 'story', icon: '📸', label: 'Story' },
];

const EMOJIS = ['📦', '🚲', '📱', '🪑', '👗', '📚', '🎸', '🌿', '🎨', '🥖', '🍷', '🌱', '🔧', '👶', '🐕', '💻'];

export default function ComposePage() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<PostType>('sell');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [geolockHint, setGeolockHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quartier, setQuartier] = useState('Bastille');

  useEffect(() => {
    setQuartier(getClientPosition().quartier.split(' · ')[0]);
  }, []);

  const withPrice = type === 'sell' || type === 'service';

  async function publish() {
    setError(null);
    if (!title.trim()) {
      setError('Il faut un titre.');
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      const priceCents = withPrice && price ? Math.round(parseFloat(price.replace(',', '.')) * 100) : null;
      const pos = getClientPosition();

      const { error: insertError } = await supabase.from('posts').insert({
        author_id: user.id,
        type,
        title: title.trim(),
        body: body.trim() || null,
        price_cents: priceCents,
        emoji,
        image_url: imageUrl,
        lat: pos.lat,
        lng: pos.lng,
        geolock_lat: type === 'geolock' ? pos.lat : null,
        geolock_lng: type === 'geolock' ? pos.lng : null,
        geolock_hint: type === 'geolock' ? geolockHint.trim() || null : null,
      });
      if (insertError) throw insertError;

      router.push('/voisinage');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-ink-700/60">
            ✕ Annuler
          </Link>
          <span className="text-sm font-extrabold">Nouveau post</span>
          <button
            onClick={publish}
            disabled={loading}
            className="bg-ink-900 text-cream-50 px-4 py-2 rounded-full text-xs font-bold shadow-soft disabled:opacity-50"
          >
            {loading ? '…' : 'Publier'}
          </button>
        </header>

        <div className="px-3 lg:px-8 py-4 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Type de post
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={clsx(
                    'p-3 rounded-2xl shadow-soft text-center transition bg-surface',
                    type === t.id && 'ring-2 ring-sunset-500',
                  )}
                >
                  <div className="text-2xl">{t.icon}</div>
                  <div
                    className={clsx(
                      'text-[11px] font-bold mt-1',
                      type === t.id ? 'text-ink-900' : 'text-ink-700/60',
                    )}
                  >
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Photo
            </div>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              fallbackEmoji={emoji}
              gradient={POST_TYPE_META[type].gradient}
            />
          </div>

          {/* Emoji de secours (si pas de photo) */}
          {!imageUrl && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
                Ou choisis un emoji
              </div>
              <div className="bg-surface rounded-2xl p-3 shadow-soft border border-ink-900/5 flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={clsx(
                      'w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition',
                      emoji === e ? 'bg-sunset-300/50 ring-2 ring-sunset-500' : 'bg-sand-100',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-surface rounded-3xl p-4 shadow-soft border border-ink-900/5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'sell'
                  ? 'Ex : VAE 25 km/h état impeccable'
                  : type === 'service'
                    ? 'Ex : Cours de jardinage urbain (2h)'
                    : type === 'event'
                      ? "Ex : Apéro du quartier ce soir 19h"
                      : type === 'geolock'
                        ? 'Ex : Un secret t’attend'
                        : 'Titre du post…'
              }
              maxLength={140}
              className="w-full text-base font-extrabold pb-2 border-b border-ink-900/10 outline-none bg-transparent placeholder:text-ink-700/30"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Décris ton post…"
              maxLength={5000}
              className="w-full mt-3 text-sm outline-none bg-transparent resize-none min-h-[80px] placeholder:text-ink-700/30"
            />
            {withPrice && (
              <div className="flex items-center gap-2 pt-3 border-t border-ink-900/6">
                <span className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
                  PRIX
                </span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="text-2xl font-black w-24 outline-none bg-transparent placeholder:text-ink-700/20"
                />
                <span className="text-2xl font-black">€</span>
              </div>
            )}
            {type === 'geolock' && (
              <div className="pt-3 border-t border-ink-900/6">
                <label className="text-[11px] uppercase tracking-wider font-bold text-lilac-500">
                  🔮 Indice du lieu à visiter
                </label>
                <input
                  value={geolockHint}
                  onChange={(e) => setGeolockHint(e.target.value)}
                  placeholder="Ex : Pont rue de Charonne"
                  className="w-full text-sm font-semibold outline-none bg-transparent mt-1 placeholder:text-ink-700/30"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-coral-400/10 border border-coral-400/30 rounded-2xl px-4 py-3 text-xs font-semibold text-coral-500">
              {error}
            </div>
          )}

          {/* Visibility */}
          <div className="bg-gradient-to-br from-cream-50 to-sand-100 rounded-3xl p-4 flex items-center gap-3 border border-ink-900/5">
            <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center text-base">
              📍
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
                Visibilité
              </div>
              <div className="text-sm font-extrabold">
                Aura · 500m · {quartier}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
