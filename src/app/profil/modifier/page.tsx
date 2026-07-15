import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import { createClient } from '@/lib/supabase/server';
import { type Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="text-5xl mb-3">⚙️</div>
          <h1 className="text-2xl font-black">Paramètres du profil.</h1>
          <p className="text-sm text-ink-700/60 mt-2">Connecte-toi pour modifier tes informations.</p>
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

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const profile = data as Profile;

  return (
    <Shell>
      <div className="max-w-xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/profil" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Modifier le profil</h1>
        </header>

        <div className="px-4 lg:px-8 py-4">
          <ProfileEditForm
            profile={{
              id: profile.id,
              display_name: profile.display_name,
              avatar_emoji: profile.avatar_emoji,
              bio: profile.bio,
              tagline: profile.tagline,
              aura_radius_m: profile.aura_radius_m,
              is_pro: profile.is_pro,
              is_private: profile.is_private,
            }}
          />
        </div>
      </div>
    </Shell>
  );
}
