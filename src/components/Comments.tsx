'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { type CommentItem, timeAgo } from '@/lib/types';

export function Comments({ postId }: { postId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Chargement initial + utilisateur
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => active && setUid(data.user?.id ?? null));
    supabase.rpc('post_comments', { p_post_id: postId }).then(({ data }) => {
      if (!active) return;
      setComments((data ?? []) as CommentItem[]);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Temps réel : nouveaux commentaires
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const row = payload.new as { id: string };
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return prev;
          });
          // Récupère le profil de l'auteur du commentaire pour l'afficher
          const { data } = await supabase.rpc('post_comments', { p_post_id: postId });
          setComments((data ?? []) as CommentItem[]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    if (!uid) {
      router.push('/connexion');
      return;
    }
    setBusy(true);
    // Ajout optimiste
    const optimistic: CommentItem = {
      id: `tmp-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      user_id: uid,
      handle: 'toi',
      display_name: 'Toi',
      avatar_emoji: '📍',
    };
    setComments((prev) => [...prev, optimistic]);
    setText('');
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: uid, body });
    if (error) {
      // rollback
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setText(body);
    } else {
      // rafraîchit avec la vraie ligne
      const { data } = await supabase.rpc('post_comments', { p_post_id: postId });
      setComments((data ?? []) as CommentItem[]);
    }
    setBusy(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  return (
    <section className="pt-2">
      <h2 className="text-sm font-black uppercase tracking-wider text-ink-700/50 mb-3">
        Commentaires{comments.length > 0 && ` · ${comments.length}`}
      </h2>

      <div className="space-y-3">
        {loaded && comments.length === 0 && (
          <p className="text-sm text-ink-700/50 py-2">
            Aucun commentaire. Sois le premier à réagir 🗨️
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lilac-300 to-lilac-500 flex items-center justify-center text-base shadow-pin flex-shrink-0">
              {c.avatar_emoji ?? '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-sand-100 rounded-2xl rounded-tl-md px-3.5 py-2">
                <div className="text-xs font-extrabold">
                  {c.display_name ?? 'Un voisin'}{' '}
                  <span className="text-ink-700/40 font-normal">@{c.handle ?? 'voisin'}</span>
                </div>
                <div className="text-sm text-ink-900/90 whitespace-pre-wrap break-words">{c.body}</div>
              </div>
              <div className="text-[10px] text-ink-700/40 mt-0.5 ml-1">{timeAgo(c.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Saisie */}
      <div className="sticky bottom-[92px] lg:bottom-4 mt-4 flex items-center gap-2 bg-cream-50/95 backdrop-blur-xl rounded-full shadow-soft p-1.5 border border-ink-900/5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={uid ? 'Écris un commentaire…' : 'Connecte-toi pour commenter'}
          maxLength={500}
          className="flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          aria-label="Envoyer le commentaire"
          className="w-9 h-9 rounded-full bg-ink-900 text-cream-50 flex items-center justify-center text-sm font-bold disabled:opacity-40 active:scale-95 transition"
        >
          ➤
        </button>
      </div>
    </section>
  );
}
