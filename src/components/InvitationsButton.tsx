'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Icône "invitations" avec badge du nombre de demandes reçues, → /invitations. */
export function InvitationsButton() {
  const supabase = createClient();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.rpc('my_follow_requests').then(({ data }) => setCount((data as unknown[])?.length ?? 0));
  }, [pathname, supabase]);

  return (
    <Link href="/invitations" aria-label="Invitations" className="relative text-xl">
      🤝
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-cream-50">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
