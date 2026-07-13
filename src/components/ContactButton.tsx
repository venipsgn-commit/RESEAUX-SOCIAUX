'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'loading' | 'none' | 'pending_out' | 'pending_in' | 'accepted' | 'self';

export function ContactButton({ otherId, otherHandle }: { otherId: string; otherHandle: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('connection_status', { other: otherId }).then(({ data }) => {
      setStatus((data as Status) ?? 'none');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  async function openDm() {
    const { data } = await supabase.rpc('get_or_create_dm', { other: otherId });
    if (data) router.push(`/messages/${data}`);
    else setBusy(false);
  }

  async function onClick() {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    if (status === 'accepted') {
      await openDm();
      return;
    }
    const { data: res } = await supabase.rpc('request_follow', { other: otherId });
    if (res === 'accepted') {
      setStatus('accepted');
      await openDm();
    } else {
      setStatus('pending_out');
      setBusy(false);
    }
  }

  if (status === 'self') return null;

  const label =
    status === 'loading'
      ? '…'
      : status === 'accepted'
        ? `💬 Contacter ${otherHandle}`
        : status === 'pending_out'
          ? '⏳ Invitation envoyée'
          : status === 'pending_in'
            ? "✅ Accepter l'invitation"
            : `👋 Se connecter avec ${otherHandle}`;

  return (
    <button
      onClick={onClick}
      disabled={busy || status === 'loading' || status === 'pending_out'}
      className="w-full py-3 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-soft disabled:opacity-50"
    >
      {busy ? '…' : label}
    </button>
  );
}
