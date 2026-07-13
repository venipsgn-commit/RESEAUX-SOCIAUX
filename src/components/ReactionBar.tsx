'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

type Props = {
  postId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikeCount: number;
  size?: 'sm' | 'lg';
  /** 'facebook' = pied complet (résumé + J'aime / Commenter / Partager). */
  variant?: 'inline' | 'facebook';
  shareTitle?: string;
};

function ThumbIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ReactionBar({
  postId,
  initialLiked,
  initialSaved,
  initialLikeCount,
  size = 'lg',
  variant = 'inline',
  shareTitle,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [busy, setBusy] = useState(false);

  async function toggle(kind: 'like' | 'save') {
    if (busy) return;
    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }

    const isLike = kind === 'like';
    const currentlyOn = isLike ? liked : saved;

    // Optimistic UI
    if (isLike) {
      setLiked(!currentlyOn);
      setLikeCount((c) => c + (currentlyOn ? -1 : 1));
    } else {
      setSaved(!currentlyOn);
    }

    try {
      if (currentlyOn) {
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('kind', kind);
      } else {
        await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, kind });
      }
    } catch {
      // rollback en cas d'erreur
      if (isLike) {
        setLiked(currentlyOn);
        setLikeCount((c) => c + (currentlyOn ? 1 : -1));
      } else {
        setSaved(currentlyOn);
      }
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/post/${postId}`;
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: shareTitle ?? 'AURA', url });
      } catch {
        /* annulé */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ icon: '🔗', title: 'Lien copié !', text: 'Partage-le à un voisin.' });
      } catch {
        /* ignore */
      }
    }
  }

  // ── Pied de publication façon Facebook ────────────────────────────
  if (variant === 'facebook') {
    return (
      <div className="mt-2">
        {/* Résumé des réactions */}
        <div className="px-4 h-9 flex items-center justify-between">
          {likeCount > 0 ? (
            <div className="flex items-center gap-1.5 text-[13px] text-ink-700/60">
              <span className="flex -space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-sky2-400 to-sky2-500 flex items-center justify-center text-[11px] border-2 border-white relative z-10">
                  👍
                </span>
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-[11px] border-2 border-white">
                  ❤️
                </span>
              </span>
              <span className="font-semibold">{likeCount}</span>
            </div>
          ) : (
            <span className="text-[12px] text-ink-700/35">Sois le premier à aimer 💛</span>
          )}
          <button
            onClick={() => toggle('save')}
            aria-label="Enregistrer"
            className={`transition active:scale-110 ${saved ? 'text-sunset-500' : 'text-ink-700/40'}`}
          >
            <BookmarkIcon filled={saved} />
          </button>
        </div>

        {/* Barre d'actions */}
        <div className="mx-3 mb-1 pt-1 border-t border-ink-900/[0.07] flex items-stretch">
          <button
            onClick={() => toggle('like')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 my-1 rounded-xl transition active:scale-95 hover:bg-ink-900/[0.04] ${
              liked ? 'text-coral-500' : 'text-ink-700/65'
            }`}
          >
            <ThumbIcon filled={liked} />
            <span className="text-[14px] font-bold">J&apos;aime</span>
          </button>
          <button
            onClick={() => router.push(`/post/${postId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 my-1 rounded-xl text-ink-700/65 transition active:scale-95 hover:bg-ink-900/[0.04]"
          >
            <CommentIcon />
            <span className="text-[14px] font-bold">Commenter</span>
          </button>
          <button
            onClick={share}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 my-1 rounded-xl text-ink-700/65 transition active:scale-95 hover:bg-ink-900/[0.04]"
          >
            <ShareIcon />
            <span className="text-[14px] font-bold">Partager</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Variante compacte (page d'un post) ────────────────────────────
  const iconSize = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex gap-4 items-center">
      <button onClick={() => toggle('like')} aria-label="J'aime" className={`${iconSize} transition active:scale-125`}>
        {liked ? '❤️' : '♡'}
      </button>
      {likeCount > 0 && <span className="text-sm font-bold -ml-2">{likeCount}</span>}
      <button
        onClick={() => router.push(`/post/${postId}`)}
        aria-label="Commenter"
        className={size === 'lg' ? 'text-xl' : 'text-lg'}
      >
        💬
      </button>
      <button onClick={share} aria-label="Partager" className={size === 'lg' ? 'text-xl' : 'text-lg'}>
        ↗
      </button>
      <div className="flex-1" />
      <button
        onClick={() => toggle('save')}
        aria-label="Enregistrer"
        className={`${size === 'lg' ? 'text-xl' : 'text-lg'} transition active:scale-125 ${saved ? '' : 'opacity-40 grayscale'}`}
      >
        🔖
      </button>
    </div>
  );
}
