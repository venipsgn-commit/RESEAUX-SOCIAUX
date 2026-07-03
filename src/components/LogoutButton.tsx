'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="px-3 py-1.5 bg-sand-100 rounded-full text-xs font-bold text-ink-700/70"
    >
      Se déconnecter
    </button>
  );
}
