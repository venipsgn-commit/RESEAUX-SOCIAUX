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
    <Link
      href="/invitations"
      aria-label="Invitations"
      className="relative flex items-center justify-center text-ink-900"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-cream-50">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
