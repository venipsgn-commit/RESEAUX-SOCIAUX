import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { InvitationList } from '@/components/InvitationList';
import { SentInvitations } from '@/components/SentInvitations';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function InvitationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-2xl font-black">Tes invitations.</h1>
          <p className="text-sm text-ink-700/60 mt-2">Connecte-toi pour gérer tes connexions.</p>
          <Link
            href="/connexion"
            className="inline-block mt-6 px-8 py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift"
          >
            Se connecter
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/voisinage" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Invitations</h1>
        </header>

        <div className="px-4 lg:px-8 pt-4">
          <Link
            href="/voisins"
            className="flex items-center justify-between gap-3 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-2xl px-4 py-3.5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <div>
                <div className="font-extrabold text-sm">Découvrir mes voisins</div>
                <div className="text-[11px] text-white/80">Invite-les à devenir amis</div>
              </div>
            </div>
            <span className="text-lg">→</span>
          </Link>
        </div>

        <div className="pt-2">
          <InvitationList title="Reçues" />
        </div>
        <SentInvitations />
      </div>
    </Shell>
  );
}
