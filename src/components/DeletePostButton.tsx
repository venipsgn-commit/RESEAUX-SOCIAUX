'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DeletePostButton({
  postId,
  redirectTo,
  variant = 'inline',
}: {
  postId: string;
  redirectTo?: string;
  variant?: 'inline' | 'full';
}) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    // Soft-delete : status -> removed (respecte la RLS posts_update_own)
    const { error } = await supabase.from('posts').update({ status: 'removed' }).eq('id', postId);
    setBusy(false);
    if (!error) {
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className={
          variant === 'full'
            ? 'w-full py-2.5 bg-coral-400/10 text-coral-500 rounded-full font-bold text-sm'
            : 'text-xs font-bold text-coral-500'
        }
      >
        🗑 Supprimer
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={remove}
        disabled={busy}
        className="px-3 py-2 bg-coral-500 text-white rounded-full text-xs font-bold disabled:opacity-50"
      >
        {busy ? '…' : 'Confirmer'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-3 py-2 bg-sand-100 rounded-full text-xs font-bold"
      >
        Annuler
      </button>
    </div>
  );
}
