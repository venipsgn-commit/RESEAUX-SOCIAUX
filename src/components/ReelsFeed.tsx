'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Reel } from '@/lib/types';

export function ReelsFeed({ reels }: { reels: Reel[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lecture auto de la vidéo visible, pause des autres
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target.querySelector('video') as HTMLVideoElement | null;
          if (!v) return;
          if (e.isIntersecting && e.intersectionRatio > 0.6) v.play().catch(() => {});
          else v.pause();
        });
      },
      { root, threshold: [0, 0.6, 1] },
    );
    root.querySelectorAll('[data-reel]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reels]);

  // Applique l'état muet à toutes les vidéos
  useEffect(() => {
    scrollRef.current?.querySelectorAll('video').forEach((v) => {
      (v as HTMLVideoElement).muted = muted;
    });
  }, [muted, reels]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErr('Choisis une vidéo.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErr('Vidéo trop lourde (50 Mo max).');
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${user.id}/reel-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('message-media')
        .upload(path, file, { contentType: file.type || 'video/mp4', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('message-media').getPublicUrl(path);
      const { error } = await supabase.from('reels').insert({ user_id: user.id, video_url: data.publicUrl });
      if (error) throw error;
      router.refresh();
    } catch {
      setErr("Échec de l'envoi de la vidéo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative h-[calc(100dvh-88px)] lg:h-screen bg-ink-900">
      <input ref={fileRef} type="file" accept="video/*" onChange={onPick} className="hidden" />

      {/* En-tête */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-4 pointer-events-none">
        <span className="text-cream-50 text-xl font-black drop-shadow pointer-events-auto">Réels</span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="pointer-events-auto bg-cream-50 text-ink-900 rounded-full px-4 py-2 text-sm font-bold shadow-lift active:scale-95 transition disabled:opacity-50"
        >
          {uploading ? 'Envoi…' : '＋ Réel'}
        </button>
      </div>
      {err && (
        <div className="absolute top-16 inset-x-0 z-20 text-center text-xs text-coral-500 font-semibold">
          {err}
        </div>
      )}

      {reels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-cream-50/70 gap-3 px-8 text-center">
          <div className="text-6xl">🎬</div>
          <p className="font-bold text-cream-50 text-lg">Aucun réel pour l&apos;instant.</p>
          <p className="text-sm">Sois le premier à publier une vidéo courte de ton quartier.</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 bg-cream-50 text-ink-900 rounded-full px-6 py-3 font-bold shadow-lift active:scale-95 transition"
          >
            Publier un réel
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onClick={() => setMuted((m) => !m)}
          className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {reels.map((r) => (
            <section
              key={r.id}
              data-reel
              className="relative h-full w-full snap-start flex items-center justify-center overflow-hidden"
            >
              <video
                src={r.video_url}
                loop
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-transparent to-ink-900/20" />

              <div className="absolute bottom-6 left-4 right-16 z-10 text-cream-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-xl border border-cream-50/25 shadow-pin">
                    {r.avatar_emoji ?? '📍'}
                  </div>
                  <span className="font-extrabold text-sm drop-shadow">{r.display_name ?? 'Voisin·e'}</span>
                </div>
                {r.caption && <p className="text-sm mt-2 drop-shadow leading-snug">{r.caption}</p>}
              </div>

              <div className="absolute bottom-6 right-4 z-10 text-cream-50/85 text-lg">
                {muted ? '🔇' : '🔊'}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
