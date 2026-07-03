'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ContactButton({
  otherId,
  otherHandle,
}: {
  otherId: string;
  otherHandle: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function contact() {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherId });
    if (!error && data) {
      router.push(`/messages/${data}`);
    } else {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={contact}
      disabled={busy}
      className="w-full py-3 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-soft disabled:opacity-50"
    >
      {busy ? '…' : `💬 Contacter ${otherHandle}`}
    </button>
  );
}
