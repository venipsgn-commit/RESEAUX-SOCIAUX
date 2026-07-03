'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikeCount: number;
  size?: 'sm' | 'lg';
};

export function ReactionBar({
  postId,
  initialLiked,
  initialSaved,
  initialLikeCount,
  size = 'lg',
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

  const iconSize = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex gap-4 items-center">
      <button onClick={() => toggle('like')} aria-label="J'aime" className={`${iconSize} transition active:scale-125`}>
        {liked ? '❤️' : '♡'}
      </button>
      {likeCount > 0 && <span className="text-sm font-bold -ml-2">{likeCount}</span>}
      <button aria-label="Commenter" className={size === 'lg' ? 'text-xl' : 'text-lg'}>
        💬
      </button>
      <button aria-label="Partager" className={size === 'lg' ? 'text-xl' : 'text-lg'}>
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
