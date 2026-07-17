'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

export function RsvpButton({ postId }: { postId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [going, setGoing] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.rpc('rsvp_info', { p_post_id: postId }).then(({ data }) => {
      const row = (data as { cnt: number; going: boolean }[])?.[0];
      if (row) {
        setCount(row.cnt);
        setGoing(row.going);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function toggle() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    const next = !going;
    setGoing(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      await supabase.from('event_rsvps').insert({ post_id: postId, user_id: user.id });
      toast({ icon: '🙋', title: 'Tu participes !' });
    } else {
      await supabase.from('event_rsvps').delete().eq('post_id', postId).eq('user_id', user.id);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`w-full py-3 rounded-full font-extrabold text-sm shadow-soft text-white ${
        going ? 'bg-forest-500' : 'bg-sunset-500'
      }`}
    >
      {going ? `✓ Je participe${count > 0 ? ` · ${count}` : ''}` : `Je viens 🙋${count > 0 ? ` · ${count} inscrit${count > 1 ? 's' : ''}` : ''}`}
    </button>
  );
}
