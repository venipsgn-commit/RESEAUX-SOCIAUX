'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Reel, CommentItem } from '@/lib/types';

function fmtCount(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const IconThumb = ({ filled = false }: { filled?: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);
const IconComment = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </svg>
);
const IconShare = () => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </svg>
);
const IconBookmark = ({ filled = false }: { filled?: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

function ActionButton({
  onClick,
  label,
  children,
  active,
}: {
  onClick: () => void;
  label?: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-1 active:scale-90 transition"
    >
      <span className={active ? 'text-forest-400' : 'text-cream-50'} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}>
        {children}
      </span>
      {label !== undefined && (
        <span className="text-cream-50 text-[11px] font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>
          {label}
        </span>
      )}
    </button>
  );
}

function ReelCard({ reel, uid }: { reel: Reel; uid: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const [liked, setLiked] = useState(reel.viewer_liked);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [saved, setSaved] = useState(reel.viewer_saved);
  const [commentCount, setCommentCount] = useState(reel.comment_count);
  const [sheet, setSheet] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function toggleLike() {
    if (!uid) {
      router.push('/connexion');
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (next) await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: uid });
    else await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', uid);
  }

  async function toggleSave() {
    if (!uid) {
      router.push('/connexion');
      return;
    }
    const next = !saved;
    setSaved(next);
    if (next) await supabase.from('reel_saves').insert({ reel_id: reel.id, user_id: uid });
    else await supabase.from('reel_saves').delete().eq('reel_id', reel.id).eq('user_id', uid);
  }

  async function share() {
    const url = `${window.location.origin}/reels`;
    try {
      if (navigator.share) await navigator.share({ title: 'Réel AURA', url });
      else {
        await navigator.clipboard.writeText(url);
        alert('Lien copié !');
      }
    } catch {
      /* annulé */
    }
  }

  async function openComments() {
    setSheet(true);
    if (!loaded) {
      const { data } = await supabase.rpc('reel_comments_list', { p_reel_id: reel.id });
      setComments((data ?? []) as CommentItem[]);
      setLoaded(true);
    }
  }

  async function sendComment() {
    const body = text.trim();
    if (!body) return;
    if (!uid) {
      router.push('/connexion');
      return;
    }
    setText('');
    const optimistic: CommentItem = {
      id: `tmp-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      user_id: uid,
      handle: 'toi',
      display_name: 'Toi',
      avatar_emoji: '📍',
    };
    setComments((p) => [...p, optimistic]);
    setCommentCount((c) => c + 1);
    const { error } = await supabase.from('reel_comments').insert({ reel_id: reel.id, user_id: uid, body });
    if (!error) {
      const { data } = await supabase.rpc('reel_comments_list', { p_reel_id: reel.id });
      setComments((data ?? []) as CommentItem[]);
    }
  }

  return (
    <section data-reel className="relative h-full w-full snap-start flex items-center justify-center overflow-hidden">
      <video src={reel.video_url} loop playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-transparent to-ink-900/20" />

      {/* Actions à droite (façon Facebook) */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5">
        <ActionButton onClick={toggleLike} active={liked} label={fmtCount(likeCount)}>
          <IconThumb filled={liked} />
        </ActionButton>
        <ActionButton onClick={openComments} label={fmtCount(commentCount)}>
          <IconComment />
        </ActionButton>
        <ActionButton onClick={share} label="Partager">
          <IconShare />
        </ActionButton>
        <ActionButton onClick={toggleSave} active={saved} label="Enregistrer">
          <IconBookmark filled={saved} />
        </ActionButton>
      </div>

      {/* Auteur + légende */}
      <div className="absolute bottom-6 left-4 right-20 z-10 text-cream-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-xl border border-cream-50/25 shadow-pin">
            {reel.avatar_emoji ?? '📍'}
          </div>
          <span className="font-extrabold text-sm drop-shadow">{reel.display_name ?? 'Voisin·e'}</span>
        </div>
        {reel.caption && <p className="text-sm mt-2 drop-shadow leading-snug">{reel.caption}</p>}
      </div>

      {/* Feuille de commentaires */}
      {sheet && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setSheet(false)} />
          <div className="relative bg-cream-50 text-ink-900 rounded-t-3xl max-h-[70%] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-900/5">
              <span className="font-black">{commentCount} commentaire{commentCount > 1 ? 's' : ''}</span>
              <button onClick={() => setSheet(false)} className="text-ink-700/50 text-xl">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loaded && comments.length === 0 && (
                <p className="text-sm text-ink-700/50 text-center py-6">Sois le premier à commenter 💬</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lilac-300 to-lilac-500 flex items-center justify-center text-sm flex-shrink-0">
                    {c.avatar_emoji ?? '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-extrabold">{c.display_name ?? 'Voisin·e'}</span>
                    <p className="text-sm break-words">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2.5 border-t border-ink-900/5 bg-cream-50 pb-[max(env(safe-area-inset-bottom),10px)]">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                placeholder="Ajoute un commentaire…"
                className="flex-1 bg-sand-100 rounded-full px-4 py-2.5 text-sm outline-none"
              />
              <button
                onClick={sendComment}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center disabled:opacity-40"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function ReelsFeed({ reels }: { reels: Reel[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="absolute top-16 inset-x-0 z-20 text-center text-xs text-coral-500 font-semibold">{err}</div>
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
            <ReelCard key={r.id} reel={r} uid={uid} />
          ))}
        </div>
      )}
    </div>
  );
}
